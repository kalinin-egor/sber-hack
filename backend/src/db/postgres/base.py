from abc import ABC
from typing import Generic, Optional, Type

from sqlalchemy import insert, select, update
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession

from exceptions import DBException, DoesNotExist
from common_models import Model
from common_schemas import Schema

import logging
logging.basicConfig()
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)


class BaseRepository(Generic[Schema, Model], ABC):
    model: Type[Model]
    schema: Type[Schema]

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def insert_one(self, obj: Schema) -> int:
        try:
            insertion_result = await self._session.execute(insert(self.model).returning(self.model), obj.model_dump())
        except IOError:
            raise DBException("Error while adding object to database")
        inserted_obj = insertion_result.scalars().one()
        return int(str(inserted_obj.id))

    async def update_by_id(self, obj_id: int, obj: Schema) -> Schema:
        try:
            obj_dump = obj.model_dump()
            # del obj_dump["id"]
            update_result = await self._session.execute(
                update(self.model).returning(self.model).where(self.model.id == obj_id).values(obj_dump)
            )
        except IntegrityError:
            raise DBException("Error while updating object to database")
        try:
            updated_obj = update_result.scalars().one()
        except NoResultFound:
            raise DoesNotExist("Object does not exist")
        return self.schema.model_validate(updated_obj, from_attributes=True)

    async def find_by_id(self, obj_id: int) -> Optional[Schema]:
        query_result = await self._session.execute(select(self.model).where(self.model.id == obj_id))
        try:
            obj = query_result.scalars().one()
        except NoResultFound:
            return None
        return self.schema.model_validate(obj, from_attributes=True)

    async def delete_by_id(self, obj_id: int) -> Schema:
        row = await self.find_by_id(obj_id)
        if row is None:
            raise DoesNotExist("Unable to delete row that does not exist")
        await self._session.execute(update(self.model).where(self.model.id == obj_id).values(is_deleted=True))
        return row

    async def commit(self):
        await self._session.commit()
