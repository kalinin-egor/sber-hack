from dependency_injector import containers, providers

from config import RedisConfig
from db.redis.redis_client import RedisClient


class RedisContainer(containers.DeclarativeContainer):
    redis_client = providers.Singleton(RedisClient, RedisConfig())
