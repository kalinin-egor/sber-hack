import hashlib
import re
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

import aiosmtplib
from dependency_injector.wiring import Provide
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from v1.auth.config import AuthServiceConfig
from db.redis.redis_client import RedisClient
from v1.auth.constants import WELCOME_MESSAGE
from v1.auth.dependencies.redis_container import RedisContainer
import logging

logger = logging.getLogger("auth")

# Security scheme
security = HTTPBearer()


# Legacy SMS and Email workers (simplified)
class SMSWorker:
    def __init__(self, config: AuthServiceConfig):
        self.config = config

    async def send_sms(self, phone_number: str, verify_code: int, mode: str = "SMS Aero"):
        # Simplified SMS sending
        return {"status": "sent", "mode": mode}


class Emailer:
    def __init__(self, config: AuthServiceConfig):
        self.config = config

    async def send_email(self, email: str, verify_code: int):
        """Отправка email с кодом подтверждения"""
        try:
            # Логируем настройки SMTP
            print(f"=== SMTP Configuration ===")
            print(f"SMTP_HOST: {self.config.SMTP_HOST}")
            print(f"SMTP_PORT: {self.config.SMTP_PORT}")
            print(f"SENDER_EMAIL: {self.config.SENDER_EMAIL}")
            print(f"EMAIL_PASSWORD: {'***SET***' if self.config.EMAIL_PASSWORD else '***NOT SET***'}")
            print(f"EMAIL_PASSWORD_LENGTH: {len(self.config.EMAIL_PASSWORD) if self.config.EMAIL_PASSWORD else 0}")
            print(f"EMAIL_USE_TLS: {self.config.EMAIL_USE_TLS}")
            print(f"========================")
            
            # Создаем сообщение
            message = MIMEMultipart()
            message["From"] = self.config.SENDER_EMAIL
            message["To"] = email
            message["Subject"] = "GPUniq - Код подтверждения регистрации"

            # Создаем HTML тело письма
            html_content = f"""
            <html>
            <body>
                <h2>Добро пожаловать в GPUniq!</h2>
                <p>Для завершения регистрации используйте следующий код подтверждения:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
                    {verify_code}
                </div>
                <p>Код действителен в течение 5 минут.</p>
                <p>Если вы не регистрировались в GPUniq, проигнорируйте это письмо.</p>
                <br>
                <p>С уважением,<br>Команда GPUniq</p>
            </body>
            </html>
            """

            message.attach(MIMEText(html_content, "html"))

            # Отправляем email
            await aiosmtplib.send(
                message,
                hostname=self.config.SMTP_HOST,
                port=self.config.SMTP_PORT,
                username=self.config.SENDER_EMAIL,
                password=self.config.EMAIL_PASSWORD,
                use_tls=False,  # Don't use TLS initially
                start_tls=True,  # Use STARTTLS for port 587
                validate_certs=False,  # Disable certificate validation for testing
            )

            return {"status": "sent", "email": email}
        except Exception as e:
            print(f"Error sending email: {e}")
            return {"status": "error", "email": email, "error": str(e)}


def compare_values(a, b):
    # Если тип - байты, декодируем в строку
    if isinstance(a, bytes):
        a = a.decode("utf-8")
    if isinstance(b, bytes):
        b = b.decode("utf-8")

    # Попробуем преобразовать строку к числу для сравнения
    try:
        # Если оба можно преобразовать в числа, сравниваем как числа
        return int(a) == int(b)
    except (ValueError, TypeError):
        # Если преобразование невозможно, сравниваем как строки
        return str(a) == str(b)


def normalize_to_integer(value) -> int:
    """Нормализация значения к целому числу"""
    if isinstance(value, str):
        return int(value)
    return value


def check_number(phone: str) -> bool:
    """Проверка корректности номера телефона"""
    return len(phone) >= 10


def check_region(phone: str, available_codes: list) -> bool:
    """Проверка доступности региона"""
    return True  # Simplified


def verify_jwt_token(token: str, secret_key: str = None) -> dict:
    """Проверка JWT токена"""
    if secret_key is None:
        from v1.auth.config import AuthServiceConfig
        secret_key = AuthServiceConfig().ACCESS_TOKEN_SECRET
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError("Token has expired")
    except jwt.InvalidSignatureError:
        raise jwt.InvalidSignatureError("Invalid token signature")
    except jwt.DecodeError:
        raise jwt.DecodeError("Invalid token format")


def is_valid_email(email: str) -> bool:
    """Проверка валидности email адреса"""
    if not email:
        return False
    
    # More strict email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False
    
    # Additional checks for common invalid patterns
    if '..' in email or email.startswith('.') or email.endswith('.'):
        return False
    
    return True


def is_valid_password(password: str) -> bool:
    """Проверка валидности пароля"""
    if not password:
        return False
    
    # Password must be between 4 and 100 characters
    if len(password) < 4 or len(password) > 100:
        return False
    
    return True


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    redis_client: RedisClient = Depends(Provide[RedisContainer.redis_client]),
) -> dict:
    """Получение текущего пользователя из JWT токена"""
    from v1.auth.config import AuthServiceConfig
    try:
        logger.info(f"[AUTH] Получен токен: {credentials.credentials[:20]}... (длина: {len(credentials.credentials)})")
        # Decode JWT token
        payload = jwt.decode(
            credentials.credentials, AuthServiceConfig().ACCESS_TOKEN_SECRET, algorithms=["HS256"]
        )
        user_id = payload.get("user_id")
        logger.info(f"[AUTH] JWT декодирован успешно, user_id: {user_id}")
        if user_id is None:
            logger.warning("[AUTH] JWT не содержит user_id")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Convert user_id to integer to avoid type mismatches
        return {"user_id": int(user_id)}
    except JWTError as e:
        logger.warning(f"[AUTH] JWT ошибка: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    logger.info(f"Verifying password...")
    logger.info(f"Input password: {password[:3]}*** (length: {len(password)})")
    logger.info(f"Stored hash: {hashed_password[:10]}*** (length: {len(hashed_password) if hashed_password else 0})")
    
    # Проверяем, что хеш не пустой
    if not hashed_password:
        logger.warning("Stored password hash is empty!")
        return False
    
    # Вычисляем хеш входящего пароля
    input_hash = hash_password(password)
    logger.info(f"Input hash: {input_hash[:10]}*** (length: {len(input_hash)})")
    
    # Сравниваем хеши
    result = input_hash == hashed_password
    logger.info(f"Password verification result: {result}")
    
    return result
