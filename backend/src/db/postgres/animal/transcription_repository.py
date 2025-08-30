from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.postgres.base import BaseRepository
from common_models import AnimalTranscription, Animal
from common_schemas import (
    AnimalTranscriptionSchema, 
    AnimalTranscriptionCreate, 
    AnimalTranscriptionUpdate
)


class AnimalTranscriptionRepository(BaseRepository[AnimalTranscriptionSchema, AnimalTranscription]):
    model = AnimalTranscription
    schema = AnimalTranscriptionSchema

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def find_by_animal_id(self, animal_id: int, limit: int = 100, offset: int = 0) -> List[AnimalTranscriptionSchema]:
        """Получить все транскрипции для конкретного животного"""
        query = select(self.model).where(
            self.model.animal_id == animal_id
        ).order_by(desc(self.model.created_at)).limit(limit).offset(offset)
        
        result = await self._session.execute(query)
        transcriptions = result.scalars().all()
        return [self.schema.model_validate(transcription, from_attributes=True) for transcription in transcriptions]

    async def find_latest_by_animal_id(self, animal_id: int) -> Optional[AnimalTranscriptionSchema]:
        """Получить последнюю транскрипцию для животного"""
        query = select(self.model).where(
            self.model.animal_id == animal_id
        ).order_by(desc(self.model.created_at)).limit(1)
        
        result = await self._session.execute(query)
        transcription = result.scalars().first()
        
        if not transcription:
            return None
            
        return self.schema.model_validate(transcription, from_attributes=True)

    async def find_by_behavior_state(self, behavior_state: str) -> List[AnimalTranscriptionSchema]:
        """Найти транскрипции по состоянию поведения"""
        query = select(self.model).where(
            self.model.behavior_state.ilike(f"%{behavior_state}%")
        ).order_by(desc(self.model.created_at))
        
        result = await self._session.execute(query)
        transcriptions = result.scalars().all()
        return [self.schema.model_validate(transcription, from_attributes=True) for transcription in transcriptions]

    async def get_transcriptions_with_measurements(self, animal_id: Optional[int] = None) -> List[AnimalTranscriptionSchema]:
        """Получить транскрипции с измерениями"""
        query = select(self.model).where(self.model.measurements.is_not(None))
        
        if animal_id:
            query = query.where(self.model.animal_id == animal_id)
            
        query = query.order_by(desc(self.model.created_at))
        
        result = await self._session.execute(query)
        transcriptions = result.scalars().all()
        return [self.schema.model_validate(transcription, from_attributes=True) for transcription in transcriptions]

    async def get_transcriptions_with_feeding_details(self, animal_id: Optional[int] = None) -> List[AnimalTranscriptionSchema]:
        """Получить транскрипции с деталями кормления"""
        query = select(self.model).where(self.model.feeding_details.is_not(None))
        
        if animal_id:
            query = query.where(self.model.animal_id == animal_id)
            
        query = query.order_by(desc(self.model.created_at))
        
        result = await self._session.execute(query)
        transcriptions = result.scalars().all()
        return [self.schema.model_validate(transcription, from_attributes=True) for transcription in transcriptions]

    async def get_transcriptions_with_relationships(self, animal_id: Optional[int] = None) -> List[AnimalTranscriptionSchema]:
        """Получить транскрипции с информацией о взаимоотношениях"""
        query = select(self.model).where(self.model.relationships.is_not(None))
        
        if animal_id:
            query = query.where(self.model.animal_id == animal_id)
            
        query = query.order_by(desc(self.model.created_at))
        
        result = await self._session.execute(query)
        transcriptions = result.scalars().all()
        return [self.schema.model_validate(transcription, from_attributes=True) for transcription in transcriptions]
