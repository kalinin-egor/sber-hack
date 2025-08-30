from typing import List, Optional, Union

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError, NoResultFound, SQLAlchemyError

from db.postgres.base import BaseRepository
from exceptions import DBException, DoesNotExist
from common_models import User
from common_schemas import SearchSchema, UserCreate, UserSchema, UserUpdate


class UserRepository(BaseRepository[UserSchema, User]):
    model = User
    schema = UserSchema

    async def select_user_by_email(self, email: str) -> Union[User, None]:
        """Check if a user exists by email."""
        try:
            result = await self._session.execute(
                select(self.model).where(self.model.email == email)
            )
            return result.scalars().one_or_none()
        except IntegrityError:
            raise DBException("Error while querying the database")

    async def select_user_by_username(self, username: str) -> Union[User, None]:
        """Check if a user exists by username."""
        try:
            result = await self._session.execute(
                select(self.model).where(self.model.username == username)
            )
            return result.scalars().one_or_none()
        except IntegrityError:
            raise DBException("Error while querying the database")

    async def select_user_by_id(self, user_id: int) -> Union[User, None]:
        """Check if a user exists by id."""
        try:
            result = await self._session.execute(
                select(self.model).where(self.model.id == user_id)
            )
            return result.scalars().one_or_none()
        except IntegrityError:
            raise DBException("Error while querying the database")

    async def update_refresh_token(self, user_id: str, refresh_token: str) -> None:
        """Update the refresh token for a given user."""
        try:
            await self._session.execute(
                update(self.model)
                .where(self.model.id == user_id)
                .values(refresh_token=refresh_token)
            )
        except IntegrityError:
            raise DBException("Error while updating refresh token")

    async def set_refresh_token(self, user_id: int, refresh_token: str):
        """Update refresh token without commit (will be handled by UoW)."""
        await self._session.execute(
            update(User).where(User.id == user_id).values(refresh_token=refresh_token)
        )

    async def create_user(self, user_data: UserCreate) -> int:
        """Create a new user."""
        try:
            user = User(**user_data.model_dump())
            self._session.add(user)
            await self._session.flush()
            return user.id
        except IntegrityError as e:
            await self._session.rollback()
            if "email" in str(e).lower():
                raise DBException("User with this email already exists")
            elif "username" in str(e).lower():
                raise DBException("User with this username already exists")
            raise DBException("Error creating user")

    async def update_user(self, user_id: int, user_data: UserUpdate) -> UserSchema:
        """Update user information."""
        try:
            update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
            if not update_data:
                return await self.find_by_id(user_id)

            result = await self._session.execute(
                update(User).where(User.id == user_id).values(**update_data).returning(User)
            )
            updated_user = result.scalars().one()
            return UserSchema.model_validate(updated_user)
        except IntegrityError as e:
            await self._session.rollback()
            if "email" in str(e).lower():
                raise DBException("User with this email already exists")
            elif "username" in str(e).lower():
                raise DBException("User with this username already exists")
            raise DBException("Error updating user")
