# uvicorn.conf.py
# Конфигурация для uvicorn с увеличенными лимитами для обработки больших аудио файлов

import uvicorn
import os

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8075,
        reload=True,
        
        # Увеличиваем лимиты для обработки больших файлов
        limit_max_requests=1000,
        limit_concurrency=100,
        
        # Настройки для больших файлов
        max_requests=1000,
        max_requests_jitter=100,
        
        # Таймауты для обработки больших файлов
        timeout_keep_alive=60,  # Увеличиваем keep-alive
        timeout_graceful_shutdown=60,  # Увеличиваем время graceful shutdown
        
        # Настройки для обработки больших запросов
        limit_request_line=8192,  # Увеличиваем лимит на длину строки запроса
        limit_request_fields=100,  # Увеличиваем лимит на количество полей
        limit_request_field_size=8192,  # Увеличиваем лимит на размер поля
        
        # Логирование
        log_level="info",
        access_log=True,
        
        # Настройки для производительности
        workers=1,  # Для разработки используем 1 worker
        loop="asyncio",
        
        # Настройки для больших файлов
        http="httptools",  # Используем httptools для лучшей производительности
    )
