from dependency_injector import containers, providers

from db.redis.redis_client import RedisClient
from config import RedisConfig


class RedisContainer(containers.DeclarativeContainer):
    redis_client = providers.Factory(RedisClient, RedisConfig())
