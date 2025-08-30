from venv import create

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import DatabaseConfig

settings = DatabaseConfig()

DATABASE_URL = "postgresql+asyncpg://kalinin_egor:1234567890@vc_postgres_container:5432/vc"
SYNC_DATABASE_URL = "postgresql://kalinin_egor:1234567890@vc_postgres_container:5432/vc"

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
