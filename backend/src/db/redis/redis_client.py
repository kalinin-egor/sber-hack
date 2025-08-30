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

    def __init__(self, config: RedisConfig = RedisConfig()):
        # Формируем Redis URL на основе конфигурации
        # В docker-compose Redis работает без пароля на стандартном порту 6379
        redis_url = f"redis://redis:6379/{config.REDIS_DB}"
        
        print(f"Connecting to Redis: {redis_url}")
        self.redis = aioredis.from_url(redis_url)

    async def set(self, key: AnyStr, value: Any, *args, **kwargs):
        await self.redis.set(key.encode(), json.dumps(value).encode("utf-8"), *args, **kwargs)

    async def get(self, key: AnyStr) -> Any:
        result = await self.redis.get(key.encode())
        if result:
            return json.loads(result.decode())
        return None

    async def delete(self, key: AnyStr) -> None:
        await self.redis.delete(key.encode())

    async def set_ttl(self, key: AnyStr, value: AnyStr, ttl: int) -> None:
        await self.redis.setex(key.encode(), ttl, value.encode())

    # Методы для верификации email
    async def set_verify_code(self, key: str, verify_code: str, ttl: int) -> None:
        """Сохранить код верификации с TTL"""
        await self.redis.setex(f"verify_code:{key}".encode(), ttl, verify_code.encode())

    async def get_verify_code(self, key: str) -> str:
        """Получить код верификации"""
        result = await self.redis.get(f"verify_code:{key}".encode())
        return result.decode() if result else None

    async def check_verify_code(self, key: str, verify_code: str) -> bool:
        """Проверить код верификации"""
        stored_code = await self.get_verify_code(key)
        return stored_code == verify_code if stored_code else False

    # Методы для временных данных пользователей
    async def set_temp_user_data(self, key: str, user_data: dict, ttl: int) -> None:
        """Сохранить временные данные пользователя"""
        await self.redis.setex(
            f"temp_user:{key}".encode(), 
            ttl, 
            json.dumps(user_data).encode("utf-8")
        )

    async def get_temp_user_data(self, key: str) -> dict:
        """Получить временные данные пользователя"""
        result = await self.redis.get(f"temp_user:{key}".encode())
        return json.loads(result.decode()) if result else None

    async def delete_temp_user_data(self, key: str) -> None:
        """Удалить временные данные пользователя"""
        await self.redis.delete(f"temp_user:{key}".encode())

    # Методы для работы с email верификацией
    async def set_email_verify_code(self, temp_token: str, verify_code: str, ttl: int) -> None:
        """Сохранить код верификации для email по temp_token"""
        await self.redis.setex(f"email_verify:{temp_token}".encode(), ttl, verify_code.encode())

    async def get_email_verify_code(self, temp_token: str) -> str:
        """Получить код верификации для email по temp_token"""
        result = await self.redis.get(f"email_verify:{temp_token}".encode())
        return result.decode() if result else None

    async def check_email_verify_code(self, temp_token: str, verify_code: str) -> bool:
        """Проверить код верификации для email по temp_token"""
        stored_code = await self.get_email_verify_code(temp_token)
        return stored_code == verify_code if stored_code else False

    async def delete_email_verify_code(self, temp_token: str) -> None:
        """Удалить код верификации для email по temp_token"""
        await self.redis.delete(f"email_verify:{temp_token}".encode())

    # Методы для rate limiting
    async def incr(self, key: str) -> int:
        """Увеличить счетчик"""
        return await self.redis.incr(key.encode())

    async def expire(self, key: str, ttl: int) -> bool:
        """Установить TTL для ключа"""
        return await self.redis.expire(key.encode(), ttl)

    async def ping(self) -> bool:
        """Проверить подключение к Redis"""
        try:
            await self.redis.ping()
            return True
        except Exception:
            return False
