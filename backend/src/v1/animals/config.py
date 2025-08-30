from pydantic_settings import BaseSettings
from typing import Optional


class AnimalsServiceConfig(BaseSettings):
    """Конфигурация для сервиса животных"""
    
    # Максимальный размер аудио файла в байтах (по умолчанию 50MB)
    MAX_AUDIO_FILE_SIZE: int = 50 * 1024 * 1024
    
    # Поддерживаемые форматы аудио файлов
    SUPPORTED_AUDIO_FORMATS: list = ["mp3", "wav", "m4a", "flac", "aac"]
    
    # Максимальная длительность аудио в секундах (по умолчанию 10 минут)
    MAX_AUDIO_DURATION: int = 600
    
    # Путь для временного сохранения аудио файлов
    TEMP_AUDIO_PATH: str = "/tmp/audio_files"
    
    # API ключи для внешних сервисов (если нужны для обработки аудио)
    SPEECH_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_prefix = "ANIMALS_"
