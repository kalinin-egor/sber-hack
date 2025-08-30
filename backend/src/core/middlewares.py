from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import time
import logging

logger = logging.getLogger(__name__)


def setup_middlewares(app: FastAPI):
    # CORS middleware
    origins = ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Gzip middleware для сжатия ответов
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Middleware для логирования запросов
    @app.middleware("http")
    async def log_requests(request, call_next):
        start_time = time.time()
        
        # Логируем информацию о запросе
        logger.info(f"Request: {request.method} {request.url}")
        
        # Для файловых запросов логируем размер
        if request.url.path == "/v1/animals/audio/process":
            content_length = request.headers.get("content-length")
            if content_length:
                size_mb = int(content_length) / (1024 * 1024)
                logger.info(f"Audio file size: {size_mb:.2f} MB")
        
        response = await call_next(request)
        
        # Логируем время выполнения
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} - {process_time:.2f}s")
        
        return response
