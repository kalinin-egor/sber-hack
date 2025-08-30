from abc import ABC
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class FastAPIConfig(BaseSettings):
    TITLE: str = Field(default="Outrich Backend API")
    DESCRIPTION: str = Field(default="Outrich core backend API")
    VERSION: str = Field(default="1.010.03")
    OPENAPI_TAGS: list = Field(
        default=[
            {"name": "Authorization", "description": "Module for authorization and token's work"},
            {"name": "Animals", "description": "Module for animals management and audio processing"},
        ]
    )

    FASTAPI_HOST: str = Field(default="0.0.0.0")
    FASTAPI_PORT: int = Field(default="8075")

    model_config = SettingsConfigDict(env_file=Path(__file__).parent.parent.joinpath(".env"), extra="ignore")


class BaseConfig(ABC, BaseSettings):
    API_KEY: str = Field()


class MobiledeConfig(BaseSettings):
    MOBILEDE_API: str = Field()
    model_config = SettingsConfigDict(env_file=Path(__file__).parent.parent.joinpath(".env"), extra="ignore")


class RedisConfig(BaseSettings):
    REDIS_URL: str = Field(default="redis://")
    REDIS_USER: str = Field(default="redis")
    REDIS_PORT: int = Field(default=6389)
    REDIS_PASSWORD: str = Field(default="root")
    REDIS_DB: int = Field(default=0)
    model_config = SettingsConfigDict(env_file=Path(__file__).parent.parent.joinpath(".env"), extra="ignore")


class DatabaseConfig(BaseSettings):
    POSTGRES_URL: str = Field(default="postgres")
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: str = Field(default="postgres")
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5437)
    POSTGRES_DB: str = Field(default="postgres")
    model_config = SettingsConfigDict(env_file=Path(__file__).parent.parent.joinpath(".env"), extra="ignore")
