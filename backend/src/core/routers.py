from fastapi import APIRouter
from v1.auth.router import router as auth_router

main_router = APIRouter(prefix="/v1")

main_router.include_router(auth_router)
