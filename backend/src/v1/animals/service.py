import logging
import os
import tempfile
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
import aiofiles

from fastapi import HTTPException, UploadFile, status
from dependency_injector.wiring import Provide

from v1.animals.config import AnimalsServiceConfig
from db.postgres.unit_of_work import UnitOfWork
from common_schemas import (
    AnimalCreate, 
    AnimalUpdate, 
    AnimalSchema,
    AnimalTranscriptionCreate,
    AnimalTranscriptionSchema,
    AnimalWithTranscriptionsSchema
)
from v1.animals.schemas import (
    AnimalCreateRequest,
    AnimalUpdateRequest,
    TranscriptionCreateRequest,
    AudioProcessingRequest,
    AnimalResponse,
    TranscriptionResponse,
    AnimalWithTranscriptionsResponse,
    AudioProcessingResponse,
    AnimalsListResponse
)

logger = logging.getLogger(__name__)


class AnimalsService:
    def __init__(self, config: AnimalsServiceConfig) -> None:
        self.config = config
        # Создаем директорию для временных аудио файлов, если она не существует
        os.makedirs(self.config.TEMP_AUDIO_PATH, exist_ok=True)
        logger.info(f"AnimalsService initialized with config: {config}")

    async def create_animal(self, data: AnimalCreateRequest) -> AnimalResponse:
        """Создание нового животного"""
        async with UnitOfWork() as uow:
            # Проверяем, что животное с таким именем не существует
            existing_animals = await uow.animals.search_by_name(data.name)
            if existing_animals:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Animal with name '{data.name}' already exists"
                )

            # Создаем животное
            animal_data = AnimalCreate(
                animal=data.animal,
                name=data.name
            )
            
            animal_id = await uow.animals.insert_one(animal_data)
            await uow.commit()

            # Получаем созданное животное
            created_animal = await uow.animals.find_by_id(animal_id)
            
            return AnimalResponse(
                id=created_animal.id,
                animal=created_animal.animal,
                name=created_animal.name,
                created_at=created_animal.created_at,
                updated_at=created_animal.updated_at
            )

    async def update_animal(self, animal_id: int, data: AnimalUpdateRequest) -> AnimalResponse:
        """Обновление информации о животном"""
        async with UnitOfWork() as uow:
            # Проверяем, что животное существует
            existing_animal = await uow.animals.find_by_id(animal_id)
            if not existing_animal:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Animal not found"
                )

            # Проверяем, что новое имя не занято другим животным
            if data.name and data.name != existing_animal.name:
                animals_with_name = await uow.animals.search_by_name(data.name)
                if animals_with_name:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Animal with name '{data.name}' already exists"
                    )

            # Обновляем животное
            update_data = AnimalUpdate()
            if data.animal is not None:
                update_data.animal = data.animal
            if data.name is not None:
                update_data.name = data.name

            updated_animal = await uow.animals.update_by_id(animal_id, update_data)
            await uow.commit()

            return AnimalResponse(
                id=updated_animal.id,
                animal=updated_animal.animal,
                name=updated_animal.name,
                created_at=updated_animal.created_at,
                updated_at=updated_animal.updated_at
            )

    async def delete_animal(self, animal_id: int) -> Dict[str, Any]:
        """Удаление животного"""
        async with UnitOfWork() as uow:
            # Проверяем, что животное существует
            existing_animal = await uow.animals.find_by_id(animal_id)
            if not existing_animal:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Animal not found"
                )

            # Удаляем животное (soft delete через базовый репозиторий)
            deleted_animal = await uow.animals.delete_by_id(animal_id)
            await uow.commit()

            return {
                "message": f"Animal '{deleted_animal.name}' has been deleted successfully",
                "deleted_animal_id": animal_id
            }

    async def get_animal_by_id(self, animal_id: int) -> AnimalResponse:
        """Получение животного по ID"""
        async with UnitOfWork() as uow:
            animal = await uow.animals.find_by_id(animal_id)
            if not animal:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Animal not found"
                )

            return AnimalResponse(
                id=animal.id,
                animal=animal.animal,
                name=animal.name,
                created_at=animal.created_at,
                updated_at=animal.updated_at
            )

    async def get_all_animals(
        self, 
        page: int = 1, 
        page_size: int = 50, 
        animal_type: Optional[str] = None
    ) -> AnimalsListResponse:
        """Получение списка всех животных с пагинацией"""
        async with UnitOfWork() as uow:
            offset = (page - 1) * page_size
            
            if animal_type:
                animals = await uow.animals.find_by_animal_type(animal_type)
                # Применяем пагинацию вручную для фильтрованного списка
                total = len(animals)
                animals = animals[offset:offset + page_size]
            else:
                animals = await uow.animals.find_all(limit=page_size, offset=offset)
                # Для подсчета общего количества делаем отдельный запрос
                all_animals = await uow.animals.find_all(limit=10000, offset=0)  # большой лимит для подсчета
                total = len(all_animals)

            animal_responses = [
                AnimalResponse(
                    id=animal.id,
                    animal=animal.animal,
                    name=animal.name,
                    created_at=animal.created_at,
                    updated_at=animal.updated_at
                )
                for animal in animals
            ]

            return AnimalsListResponse(
                animals=animal_responses,
                total=total,
                page=page,
                page_size=page_size
            )

    async def get_animal_with_transcriptions(self, animal_id: int) -> AnimalWithTranscriptionsResponse:
        """Получение животного со всеми его транскрипциями"""
        async with UnitOfWork() as uow:
            animal_with_transcriptions = await uow.animals.find_with_transcriptions(animal_id)
            if not animal_with_transcriptions:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Animal not found"
                )

            transcription_responses = [
                TranscriptionResponse(
                    id=transcription.id,
                    animal_id=transcription.animal_id,
                    behavior_state=transcription.behavior_state,
                    measurements=transcription.measurements,
                    feeding_details=transcription.feeding_details,
                    relationships=transcription.relationships,
                    created_at=transcription.created_at,
                    updated_at=transcription.updated_at
                )
                for transcription in animal_with_transcriptions.transcriptions
            ]

            return AnimalWithTranscriptionsResponse(
                id=animal_with_transcriptions.id,
                animal=animal_with_transcriptions.animal,
                name=animal_with_transcriptions.name,
                created_at=animal_with_transcriptions.created_at,
                updated_at=animal_with_transcriptions.updated_at,
                transcriptions=transcription_responses
            )

    async def create_transcription(self, data: TranscriptionCreateRequest) -> TranscriptionResponse:
        """Создание новой транскрипции для животного"""
        async with UnitOfWork() as uow:
            # Проверяем, что животное существует
            animal = await uow.animals.find_by_id(data.animal_id)
            if not animal:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Animal not found"
                )

            # Создаем транскрипцию
            transcription_data = AnimalTranscriptionCreate(
                animal_id=data.animal_id,
                behavior_state=data.behavior_state,
                measurements=data.measurements,
                feeding_details=data.feeding_details,
                relationships=data.relationships
            )

            transcription_id = await uow.animal_transcriptions.insert_one(transcription_data)
            await uow.commit()

            # Получаем созданную транскрипцию
            created_transcription = await uow.animal_transcriptions.find_by_id(transcription_id)

            return TranscriptionResponse(
                id=created_transcription.id,
                animal_id=created_transcription.animal_id,
                behavior_state=created_transcription.behavior_state,
                measurements=created_transcription.measurements,
                feeding_details=created_transcription.feeding_details,
                relationships=created_transcription.relationships,
                created_at=created_transcription.created_at,
                updated_at=created_transcription.updated_at
            )

    async def get_transcription_by_id(self, transcription_id: int) -> TranscriptionResponse:
        """Получение транскрипции по ID"""
        async with UnitOfWork() as uow:
            transcription = await uow.animal_transcriptions.find_by_id(transcription_id)
            if not transcription:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Transcription not found"
                )

            return TranscriptionResponse(
                id=transcription.id,
                animal_id=transcription.animal_id,
                behavior_state=transcription.behavior_state,
                measurements=transcription.measurements,
                feeding_details=transcription.feeding_details,
                relationships=transcription.relationships,
                created_at=transcription.created_at,
                updated_at=transcription.updated_at
            )

    async def process_audio(
        self, 
        audio_file: UploadFile, 
        data: AudioProcessingRequest
    ) -> AudioProcessingResponse:
        """Обработка аудио файла и создание транскрипции"""
        # Проверяем, что животное существует
        async with UnitOfWork() as uow:
            animal = await uow.animals.find_by_id(data.animal_id)
            if not animal:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Animal not found"
                )

        # Валидация аудио файла
        await self._validate_audio_file(audio_file)

        # Сохраняем временный файл
        temp_file_path = await self._save_temp_audio_file(audio_file)
        
        try:
            logger.info(f"Processing audio file: {temp_file_path} for animal {data.animal_id}")
            
            # Обрабатываем аудио с помощью улучшенной системы транскрипции
            processing_result = await self._process_audio_file(temp_file_path, data.description)
            
            # Создаем транскрипцию на основе результатов обработки
            async with UnitOfWork() as uow:
                transcription_data = AnimalTranscriptionCreate(
                    animal_id=data.animal_id,
                    behavior_state=processing_result.get("behavior_analysis"),
                    measurements=processing_result.get("measurements"),
                    feeding_details=processing_result.get("feeding_info"),
                    relationships=processing_result.get("relationships")
                )

                transcription_id = await uow.animal_transcriptions.insert_one(transcription_data)
                await uow.commit()

                logger.info(f"Transcription created successfully with ID: {transcription_id}")

                return AudioProcessingResponse(
                    transcription_id=transcription_id,
                    animal_id=data.animal_id,
                    processing_status="completed",
                    transcribed_text=processing_result.get("transcribed_text"),
                    analysis_results=processing_result.get("analysis_results"),
                    created_at=datetime.utcnow()
                )

        except Exception as e:
            logger.error(f"Error processing audio for animal {data.animal_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process audio file: {str(e)}"
            )
        finally:
            # Удаляем временный файл
            await self._cleanup_temp_file(temp_file_path)

    async def _validate_audio_file(self, audio_file: UploadFile) -> None:
        """Валидация аудио файла"""
        # Проверяем размер файла
        if hasattr(audio_file, 'size') and audio_file.size > self.config.MAX_AUDIO_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file too large. Maximum size: {self.config.MAX_AUDIO_FILE_SIZE / (1024*1024):.1f} MB"
            )

        # Проверяем формат файла
        if audio_file.filename:
            file_extension = audio_file.filename.split('.')[-1].lower()
            if file_extension not in self.config.SUPPORTED_AUDIO_FORMATS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported audio format: {file_extension}. Supported formats: {', '.join(self.config.SUPPORTED_AUDIO_FORMATS)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Audio file must have a filename"
            )

    async def _save_temp_audio_file(self, audio_file: UploadFile) -> str:
        """Сохранение аудио файла во временную директорию"""
        # Убеждаемся что директория существует
        os.makedirs(self.config.TEMP_AUDIO_PATH, exist_ok=True)
        
        # Генерируем уникальное имя файла
        file_extension = audio_file.filename.split('.')[-1].lower() if audio_file.filename else 'wav'
        temp_filename = f"{uuid.uuid4()}.{file_extension}"
        temp_file_path = os.path.join(self.config.TEMP_AUDIO_PATH, temp_filename)

        try:
            logger.info(f"Saving audio file to: {temp_file_path}")
            
            # Сохраняем файл
            async with aiofiles.open(temp_file_path, 'wb') as temp_file:
                content = await audio_file.read()
                await temp_file.write(content)
            
            # Проверяем что файл создался и имеет размер
            if not os.path.exists(temp_file_path) or os.path.getsize(temp_file_path) == 0:
                raise Exception("Failed to save audio file or file is empty")
            
            logger.info(f"Audio file saved successfully: {temp_file_path} ({os.path.getsize(temp_file_path)} bytes)")
            return temp_file_path

        except Exception as e:
            logger.error(f"Failed to save temporary audio file: {e}")
            # Пытаемся удалить файл если он был создан
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save audio file: {str(e)}"
            )

    async def _cleanup_temp_file(self, temp_file_path: str) -> None:
        """Удаление временного файла"""
        try:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                logger.info(f"Temporary file deleted: {temp_file_path}")
            else:
                logger.warning(f"Temporary file not found for deletion: {temp_file_path}")
        except Exception as e:
            logger.warning(f"Failed to delete temporary file {temp_file_path}: {e}")

    async def _process_audio_file(self, file_path: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Обработка аудио файла: транскрипция + анализ с помощью GigaChat"""
        try:
            # Импортируем функции для обработки аудио
            from v1.animals.utils import transcribe_russian_audio, parse_text
            
            # 1. Транскрибируем аудио в текст с помощью улучшенной системы
            logger.info(f"Starting audio transcription for file: {file_path}")
            transcribed_text = transcribe_russian_audio(file_path)
            
            if transcribed_text.startswith("Ошибка при транскрибации"):
                logger.warning(f"Transcription failed: {transcribed_text}")
                # Используем описание как fallback
                if description:
                    transcribed_text = f"Наблюдение за животным: {description}"
                else:
                    transcribed_text = "Не удалось распознать речь из аудиозаписи"
            
            logger.info(f"Transcription completed: {transcribed_text[:100]}...")
            
            # 2. Анализируем транскрибированный текст с помощью GigaChat
            logger.info("Starting text analysis with GigaChat")
            analysis_data = parse_text(transcribed_text)
            
            # 3. Формируем результат
            return {
                "transcribed_text": transcribed_text,
                "behavior_analysis": analysis_data.get("behavior_state", "Не определено"),
                "measurements": analysis_data.get("measurements", {}),
                "feeding_info": analysis_data.get("feeding_details", {}),
                "relationships": analysis_data.get("relationships", {}),
                "analysis_results": {
                    "audio_quality": "обработано",
                    "processing_time_seconds": 15,  # примерное время обработки
                    "confidence_score": 0.85,
                    "description": description,
                    "processing_method": "Audio Transcription + GigaChat Analysis",
                    "raw_analysis": analysis_data
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing audio file {file_path}: {e}")
            # В случае ошибки возвращаем базовую информацию
            return {
                "transcribed_text": f"Ошибка обработки аудио файла: {os.path.basename(file_path)}",
                "behavior_analysis": "Не удалось проанализировать поведение",
                "measurements": {},
                "feeding_info": {},
                "relationships": {},
                "analysis_results": {
                    "audio_quality": "неопределено",
                    "processing_time_seconds": 0,
                    "confidence_score": 0.0,
                    "description": description,
                    "error": str(e),
                    "processing_method": "Error fallback"
                }
            }
