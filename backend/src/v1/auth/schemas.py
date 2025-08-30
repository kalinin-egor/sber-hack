from typing import Literal, Optional

from pydantic import EmailStr

from common_schemas import BaseSchema


class UserRegisterSchema(BaseSchema):
    email: EmailStr
    username: str
    password: str


class UserLoginSchema(BaseSchema):
    email: EmailStr
    password: str


class UserProfileSchema(BaseSchema):
    id: Optional[int] = None
    email: EmailStr
    username: str
    balance: Optional[int] = 0
    is_active: Optional[bool] = True
    created_at: Optional[str] = None
    usdt_wallet: Optional[str] = None

    class Config:
        from_attributes = True


class LoginResponseSchema(BaseSchema):
    """Схема ответа для логина пользователя"""
    access_token: str
    refresh_token: str
    user: UserProfileSchema


# Legacy schemas for backward compatibility
class UserSchema(BaseSchema):
    refresh_token: str
    phone_number: str
    name: Optional[str] = None
    email: Optional[str] = None
    refer: Optional[str] = None
    favourite_cars: Optional[str] = None

    class Config:
        from_attributes = True


class SignupSchema(BaseSchema):
    phone: str = None
    send_message_type: Literal["WhatsApp", "SMS Aero"] = None


class ConfirmLoginSchema(BaseSchema):
    sign_key: str = None
    verify_code: str = None


class LoginSchema(BaseSchema):
    phone: str = None
    send_message_type: Literal["WhatsApp", "SMS Aero"] = None


class RefreshTokenSchema(BaseSchema):
    refresh_token: str = None


class ConfirmRegisterSchema(BaseSchema):
    """Схема для подтверждения регистрации"""

    temp_token: str
    confirmation_code: str


class UpdateUsernameSchema(BaseSchema):
    username: str


class UpdateUsdtWalletSchema(BaseSchema):
    usdt_wallet: str
