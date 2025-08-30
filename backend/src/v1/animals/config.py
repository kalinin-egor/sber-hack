from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


class AnimalsServiceConfig(BaseSettings):
    """Конфигурация для сервиса животных"""
    
    # Максимальный размер аудио файла в байтах (по умолчанию 50MB)
    MAX_AUDIO_FILE_SIZE: int = 50 * 1024 * 1024
    
    # Поддерживаемые форматы аудио файлов
    SUPPORTED_AUDIO_FORMATS: list = [
        "mp3", "wav", "m4a", "flac", "aac", "ogg", "wma", "webm", "opus"
    ]
    
    # Максимальная длительность аудио в секундах (по умолчанию 10 минут)
    MAX_AUDIO_DURATION: int = 600
    
    # Путь для временного сохранения аудио файлов
    TEMP_AUDIO_PATH: str = "/tmp/audio_files"
    
    # API ключи для внешних сервисов (если нужны для обработки аудио)
    SPEECH_API_KEY: Optional[str] = None
    
    # Настройки для обработки аудио
    AUDIO_SAMPLE_RATE: int = 16000  # Частота дискретизации для модели
    AUDIO_CHANNELS: int = 1  # Моно аудио
    
    # Таймауты для обработки
    AUDIO_PROCESSING_TIMEOUT: int = 300  # 5 минут на обработку
    
    model_config = ConfigDict(
        env_file=".env",
        env_prefix="ANIMALS_",
        extra="ignore"  # Игнорируем дополнительные переменные окружения
    )
