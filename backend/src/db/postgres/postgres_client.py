from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import DatabaseConfig
from urllib.parse import quote_plus

settings = DatabaseConfig()

# Build URLs from environment (.env) via pydantic settings
postgres_user = quote_plus(settings.POSTGRES_USER)
postgres_password = quote_plus(settings.POSTGRES_PASSWORD)
postgres_host = settings.POSTGRES_HOST
postgres_port = settings.POSTGRES_PORT
postgres_db = settings.POSTGRES_DB

SYNC_DATABASE_URL = (
    f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
)
DATABASE_URL = (
    f"postgresql+asyncpg://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
)

sync_engine = create_engine(SYNC_DATABASE_URL)
engine = create_async_engine(DATABASE_URL)


class Base(DeclarativeBase):
    pass


async def session_maker() -> AsyncSession:
    async_session = AsyncSession(engine)
    return async_session


async def sync_session_maker():
    sync_session = AsyncSession(engine)
    return sync_session
