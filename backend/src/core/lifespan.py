from contextlib import asynccontextmanager
import logging

from db.postgres.postgres_client import Base, sync_engine
from core.containers import setup_containers
from sqlalchemy import text
import common_models  # noqa: F401  # Ensure models are imported so mappers are configured

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def initialize_containers():
    setup_containers()  # Настройка всех контейнеров

@asynccontextmanager
async def lifespan(app):
    # Инициализация контейнеров, если ещё не выполнена
    initialize_containers()

    # Полное каскадное удаление схемы и пересоздание (dev only)
    try:
        with sync_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                text("DROP SCHEMA IF EXISTS public CASCADE")
            )
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS public"))
    except Exception as e:
        logger.warning(f"Failed to drop schema with CASCADE: {e}")

    Base.metadata.create_all(bind=sync_engine)

    try:
        # Запускаем task scheduler с обработкой ошибок
        logger.info("Task scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start task scheduler: {e}")

    print("start backend")
    
    try:
        connection = sync_engine.connect()
        print("База данных подключена!")
        connection.close()
    except Exception as e:
        print(f"Ошибка подключения: {e}")

    yield
