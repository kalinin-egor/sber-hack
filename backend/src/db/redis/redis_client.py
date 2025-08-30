import json
from typing import Any, AnyStr

import redis.asyncio as aioredis

from config import RedisConfig


class RedisClient:
    _instance = None

    def __new__(cls, *args, **kwargs):
        """
        Метод __new__ контролирует создание экземпляров класса.
        Если экземпляр уже существует, возвращаем его.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, config: RedisConfig = RedisConfig):
        self.redis = aioredis.from_url(f"{config.REDIS_URL}@{config.REDIS_USER}:{config.REDIS_PORT}/{config.REDIS_DB}")

    async def set(self, key: AnyStr, value: Any, *args, **kwargs):
        await self.redis.set(key.encode(), json.dumps(value).encode("utf-8"), *args, **kwargs)

    async def get(self, key: AnyStr) -> Any:
        return await self.redis.get(key.encode())

    async def delete(self, key: AnyStr) -> None:
        await self.redis.delete(key.encode())

    async def set_ttl(self, key: AnyStr, value: AnyStr, ttl: int) -> None:
        await self.redis.setex(key.encode(), ttl, value.encode())
