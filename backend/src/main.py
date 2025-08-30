from fastapi import FastAPI

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
    )
