from typing import Optional, Union, List
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy import select, update

from db.postgres.base import BaseRepository
from common_models import User, Search  # Добавим Search сюда
from common_schemas import UserSchema, SearchSchema
from exceptions import DBException, DoesNotExist
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

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
        """Alias for updating refresh token with commit."""
        await self._session.execute(
            update(User).where(User.id == user_id).values(refresh_token=refresh_token)
        )
        await self._session.commit()


from typing import Optional, Union, List
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, update

from db.postgres.base import BaseRepository
from common_models import User, Search
from common_schemas import UserSchema
from exceptions import DBException, DoesNotExist


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
        """Alias for updating refresh token with commit."""
        await self._session.execute(
            update(User).where(User.id == user_id).values(refresh_token=refresh_token)
        )
        await self._session.commit()

    async def get_user_search_history(self, user_id: int) -> List[SearchSchema]:
        try:
            result = await self._session.execute(
                select(Search)
                .where(Search.user_id == user_id)
                .order_by(Search.started_at.desc())
            )
            searches = result.scalars().all()
            return [SearchSchema.model_validate(s) for s in searches]
        except Exception:
            raise DBException("Failed to fetch search history")

    async def get_balance(self, user_id: int) -> int:
        """Get user's current balance."""
        result = await self._session.execute(
            select(User.balance).where(User.id == user_id)
        )
        balance = result.scalar_one_or_none()
        if balance is None:
            raise DoesNotExist("User not found")
        return balance

    async def increase_balance(self, user_id: int, amount: int):
        """Increase user balance by amount."""
        if amount < 0:
            raise ValueError("Amount must be non-negative")

        await self._session.execute(
            update(User)
            .where(User.id == user_id)
            .values(balance=User.balance + amount)
        )

    async def decrease_balance(self, user_id: int, amount: int):
        """Decrease user balance by amount (if sufficient)."""
        if amount < 0:
            raise ValueError("Amount must be non-negative")

        await self._session.execute(
            update(User)
            .where(User.id == user_id)
            .values(balance=User.balance - amount)
        )