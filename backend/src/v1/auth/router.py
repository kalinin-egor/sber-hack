from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, status

from common_schemas import ResponseSchema, TokenSchema
from v1.auth.dependencies.auth_container import AuthContainer
from v1.auth.dependencies.redis_container import RedisContainer
from v1.auth.schemas import UserLoginSchema, UserRegisterSchema, ConfirmRegisterSchema, UpdateUsernameSchema, UpdateUsdtWalletSchema
from v1.auth.service import AuthService
from v1.auth.utils import get_current_user

router = APIRouter(prefix="/auth", tags=["Authorization"])


@router.post("/register", response_model=ResponseSchema)
@inject
async def register_user(
    data: UserRegisterSchema,
    auth_service: AuthService = Depends(Provide[AuthContainer.auth_service]),
) -> ResponseSchema:
    """Регистрация нового пользователя с отправкой кода подтверждения на email"""
    result = await auth_service.register_user(data)
    return ResponseSchema(exception=0, data=result)


@router.post("/confirm-registration", response_model=ResponseSchema)
@inject
async def confirm_registration(
    data: ConfirmRegisterSchema,
    auth_service: AuthService = Depends(Provide[AuthContainer.auth_service]),
) -> ResponseSchema:
    """Подтверждение регистрации пользователя по коду из email"""
    result = await auth_service.confirm_registration(data)
    return ResponseSchema(exception=0, data=result)


@router.post("/login", response_model=ResponseSchema)
@inject
async def login_user(
    data: UserLoginSchema,
    auth_service: AuthService = Depends(Provide[AuthContainer.auth_service]),
) -> ResponseSchema:
    """Логин пользователя и получение JWT токенов с информацией о пользователе"""
    tokens = await auth_service.login_user(data)
    return ResponseSchema(exception=0, data=tokens)


@router.post("/refresh-token")
@inject
async def refresh_token(
    data: dict,
    auth_service: AuthService = Depends(Provide[AuthContainer.auth_service]),
) -> ResponseSchema:
    """Обновление токена (legacy)"""
    tokens = await auth_service.refresh_token(data.get("refresh_token"))
    return ResponseSchema(exception=0, data=dict(tokens))
