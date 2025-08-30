from contextlib import asynccontextmanager
import logging

from db.postgres.postgres_client import Base, sync_engine
from core.containers import setup_containers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def initialize_containers():
    setup_containers()  # Настройка всех контейнеров

@asynccontextmanager
async def lifespan(app):
    # Инициализация контейнеров, если ещё не выполнена
    initialize_containers()

    Base.metadata.drop_all(bind=sync_engine)
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
