from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.lifespan import lifespan
from core.middlewares import setup_middlewares
from core.routers import main_router
from config import FastAPIConfig


fastapi_config = FastAPIConfig()

app = FastAPI(
    lifespan=lifespan,
    title=fastapi_config.TITLE,
    description=fastapi_config.DESCRIPTION,
    version=fastapi_config.VERSION,
    openapi_tags=fastapi_config.OPENAPI_TAGS,
    # Увеличиваем лимит на размер файлов до 100MB
    max_request_size=100 * 1024 * 1024,  # 100MB
)

setup_middlewares(app)
app.include_router(main_router)


def create_app() -> FastAPI:
    app = FastAPI(
        lifespan=lifespan,
        title=FastAPIConfig().TITLE,
        description=FastAPIConfig().DESCRIPTION,
        version=FastAPIConfig().VERSION,
        openapi_tags=FastAPIConfig().OPENAPI_TAGS,
        # Увеличиваем лимит на размер файлов до 100MB
        max_request_size=100 * 1024 * 1024,  # 100MB
    )

    # Добавляем CORS middleware для поддержки загрузки файлов
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # В продакшене нужно указать конкретные домены
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health_check():
        return {"status": "healthy"}

    @app.get("/")
    def read_root():
        return {"message": "Sber api backend"}

    setup_middlewares(app)
    app.include_router(main_router)
    return app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app="main:create_app",
        factory=True,
        host=FastAPIConfig().FASTAPI_HOST,
        port=FastAPIConfig().FASTAPI_PORT,
        reload=True,
        # Увеличиваем лимит на размер файлов в uvicorn
        limit_max_requests=1000,
        limit_concurrency=100,
    )
