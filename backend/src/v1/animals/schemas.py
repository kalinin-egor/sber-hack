from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from common_schemas import BaseSchema


# Схемы для создания и обновления животных
class AnimalCreateRequest(BaseSchema):
    animal: str = Field(..., description="Тип животного (корова, свинья, курица и т.д.)")
    name: str = Field(..., description="Имя/кличка животного")


class AnimalUpdateRequest(BaseSchema):
    animal: Optional[str] = Field(None, description="Тип животного")
    name: Optional[str] = Field(None, description="Имя/кличка животного")


# Схема для создания транскрипции
class TranscriptionCreateRequest(BaseSchema):
    animal_id: int = Field(..., description="ID животного")
    behavior_state: Optional[str] = Field(None, description="Описание поведения и состояния")
    measurements: Optional[Dict[str, Any]] = Field(None, description="Измерения (вес, температура и т.д.)")
    feeding_details: Optional[Dict[str, Any]] = Field(None, description="Детали кормления")
    relationships: Optional[Dict[str, Any]] = Field(None, description="Взаимоотношения с другими животными")


# Схема для обработки аудио
class AudioProcessingRequest(BaseSchema):
    animal_id: int = Field(..., description="ID животного, к которому относится аудио")
    description: Optional[str] = Field(None, description="Описание аудиозаписи")


# Схемы ответов
class AnimalResponse(BaseSchema):
    id: int
    animal: str
    name: str
    created_at: datetime
    updated_at: datetime


class TranscriptionResponse(BaseSchema):
    id: int
    animal_id: int
    behavior_state: Optional[str] = None
    measurements: Optional[Dict[str, Any]] = None
    feeding_details: Optional[Dict[str, Any]] = None
    relationships: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class AnimalWithTranscriptionsResponse(AnimalResponse):
    transcriptions: List[TranscriptionResponse] = []


class AudioProcessingResponse(BaseSchema):
    transcription_id: int
    animal_id: int
    processing_status: str = Field(description="Статус обработки аудио")
    transcribed_text: Optional[str] = Field(None, description="Расшифрованный текст")
    analysis_results: Optional[Dict[str, Any]] = Field(None, description="Результаты анализа")
    created_at: datetime


class AnimalsListResponse(BaseSchema):
    animals: List[AnimalResponse]
    total: int
    page: int
    page_size: int
