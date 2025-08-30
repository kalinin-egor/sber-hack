from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.postgres.base import BaseRepository
from common_models import Animal, AnimalTranscription
from common_schemas import (
    AnimalSchema, 
    AnimalCreate, 
    AnimalUpdate,
    AnimalWithTranscriptionsSchema
)


class AnimalRepository(BaseRepository[AnimalSchema, Animal]):
    model = Animal
    schema = AnimalSchema

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def find_all(self, limit: int = 100, offset: int = 0) -> List[AnimalSchema]:
        """Получить всех животных с пагинацией"""
        query = select(self.model).limit(limit).offset(offset)
        result = await self._session.execute(query)
        animals = result.scalars().all()
        return [self.schema.model_validate(animal, from_attributes=True) for animal in animals]

    async def find_by_animal_type(self, animal_type: str) -> List[AnimalSchema]:
        """Найти животных по типу"""
        query = select(self.model).where(self.model.animal == animal_type)
        result = await self._session.execute(query)
        animals = result.scalars().all()
        return [self.schema.model_validate(animal, from_attributes=True) for animal in animals]

    async def find_with_transcriptions(self, animal_id: int) -> Optional[AnimalWithTranscriptionsSchema]:
        """Получить животное с его транскрипциями"""
        query = select(self.model).options(
            selectinload(self.model.transcriptions)
        ).where(self.model.id == animal_id)
        
        result = await self._session.execute(query)
        animal = result.scalars().first()
        
        if not animal:
            return None
            
        return AnimalWithTranscriptionsSchema.model_validate(animal, from_attributes=True)

    async def search_by_name(self, name_pattern: str) -> List[AnimalSchema]:
        """Поиск животных по имени (частичное совпадение)"""
        query = select(self.model).where(self.model.name.ilike(f"%{name_pattern}%"))
        result = await self._session.execute(query)
        animals = result.scalars().all()
        return [self.schema.model_validate(animal, from_attributes=True) for animal in animals]
