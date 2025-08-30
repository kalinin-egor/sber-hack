from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from typing import Optional

from common_schemas import ResponseSchema
from v1.animals.dependencies.animals_container import AnimalsContainer
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
from v1.animals.service import AnimalsService

router = APIRouter(prefix="/animals", tags=["Animals"])


@router.post("/", response_model=ResponseSchema)
@inject
async def create_animal(
    data: AnimalCreateRequest,
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Создание нового животного"""
    result = await animals_service.create_animal(data)
    return ResponseSchema(exception=0, data=result.model_dump())


@router.get("/", response_model=ResponseSchema)
@inject
async def get_all_animals(
    page: int = Query(1, ge=1, description="Номер страницы"),
    page_size: int = Query(50, ge=1, le=100, description="Количество животных на странице"),
    animal_type: Optional[str] = Query(None, description="Фильтр по типу животного"),
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Получение списка всех животных с пагинацией и фильтрацией"""
    result = await animals_service.get_all_animals(
        page=page, 
        page_size=page_size, 
        animal_type=animal_type
    )
    return ResponseSchema(exception=0, data=result.model_dump())


@router.get("/{animal_id}", response_model=ResponseSchema)
@inject
async def get_animal_by_id(
    animal_id: int,
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Получение животного по ID"""
    result = await animals_service.get_animal_by_id(animal_id)
    return ResponseSchema(exception=0, data=result.model_dump())


@router.get("/{animal_id}/transcriptions", response_model=ResponseSchema)
@inject
async def get_animal_with_transcriptions(
    animal_id: int,
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Получение животного со всеми его транскрипциями и данными"""
    result = await animals_service.get_animal_with_transcriptions(animal_id)
    return ResponseSchema(exception=0, data=result.model_dump())


@router.put("/{animal_id}", response_model=ResponseSchema)
@inject
async def update_animal(
    animal_id: int,
    data: AnimalUpdateRequest,
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Обновление информации о животном"""
    result = await animals_service.update_animal(animal_id, data)
    return ResponseSchema(exception=0, data=result.model_dump())


@router.delete("/{animal_id}", response_model=ResponseSchema)
@inject
async def delete_animal(
    animal_id: int,
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Удаление животного"""
    result = await animals_service.delete_animal(animal_id)
    return ResponseSchema(exception=0, data=result)


@router.post("/transcriptions", response_model=ResponseSchema)
@inject
async def create_transcription(
    data: TranscriptionCreateRequest,
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Создание новой транскрипции для животного"""
    result = await animals_service.create_transcription(data)
    return ResponseSchema(exception=0, data=result.model_dump())


@router.post("/audio/process", response_model=ResponseSchema)
@inject
async def process_audio(
    audio_file: UploadFile = File(..., description="Аудио файл для обработки"),
    animal_id: int = Form(..., description="ID животного, к которому относится аудио"),
    description: Optional[str] = Form(None, description="Описание аудиозаписи"),
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """
    Обработка аудио файла и создание транскрипции
    
    Принимает аудио файл и создает транскрипцию с анализом:
    - Распознавание речи/звуков
    - Анализ поведения животного
    - Извлечение данных об измерениях
    - Информация о кормлении
    - Взаимоотношения с другими животными
    """
    # Создаем объект запроса
    processing_request = AudioProcessingRequest(
        animal_id=animal_id,
        description=description
    )
    
    result = await animals_service.process_audio(audio_file, processing_request)
    return ResponseSchema(exception=0, data=result.model_dump())


# Дополнительные эндпоинты для удобства работы с данными
@router.get("/types/list", response_model=ResponseSchema)
@inject
async def get_animal_types(
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Получение списка всех типов животных в системе"""
    # Получаем всех животных и извлекаем уникальные типы
    all_animals = await animals_service.get_all_animals(page=1, page_size=1000)
    unique_types = list(set(animal.animal for animal in all_animals.animals))
    
    return ResponseSchema(
        exception=0, 
        data={
            "animal_types": sorted(unique_types),
            "total_types": len(unique_types)
        }
    )


@router.get("/search/by-name", response_model=ResponseSchema)
@inject
async def search_animals_by_name(
    name: str = Query(..., description="Часть имени для поиска"),
    animals_service: AnimalsService = Depends(Provide[AnimalsContainer.animals_service]),
) -> ResponseSchema:
    """Поиск животных по имени (частичное совпадение)"""
    # Пока используем простой поиск через получение всех животных
    # В будущем можно оптимизировать через отдельный метод репозитория
    all_animals = await animals_service.get_all_animals(page=1, page_size=1000)
    
    filtered_animals = [
        animal for animal in all_animals.animals 
        if name.lower() in animal.name.lower()
    ]
    
    return ResponseSchema(
        exception=0, 
        data={
            "animals": [animal.model_dump() for animal in filtered_animals],
            "total": len(filtered_animals),
            "search_term": name
        }
    )
