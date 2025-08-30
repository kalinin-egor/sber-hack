import logging
import random
from datetime import datetime, timedelta
from typing import Literal, Optional

import email_validator
from dependency_injector.wiring import Provide
from fastapi import Depends, HTTPException, status
from jose import jwt

logger = logging.getLogger(__name__)


def generate_verification_code() -> int:
    """Генерирует код верификации"""
    return random.randint(100000, 999999)


from v1.auth.config import AuthServiceConfig
from db.postgres.unit_of_work import UnitOfWork
from db.redis.redis_client import RedisClient
from common_schemas import ResponseSchema, TokenSchema, UserCreate, UserSchema
from db.redis.dependencies import RedisContainer
from v1.auth.exceptions import (
    EmailNotValidError,
    PhoneNotCorrectError,
    RegionNotAvaliableError,
    UserNotExistError,
)
from v1.auth.schemas import UserLoginSchema, UserProfileSchema, UserRegisterSchema, ConfirmRegisterSchema
from v1.auth.utils import (
    Emailer,
    SMSWorker,
    check_number,
    check_region,
    hash_password,
    normalize_to_integer,
    verify_password,
    get_current_user as get_current_user_util,
)


class AuthService:
    def __init__(
        self,
        config: AuthServiceConfig,
        redis_client: RedisClient = Depends(Provide[RedisContainer.redis_client]),
    ) -> None:
        self.config = config
        self.sms_worker = SMSWorker(config)
        self.email_worker = Emailer(config)
        # If DI did not supply a RedisClient, create one from config
        self.redis_client = redis_client or RedisClient()
        print(f"=== AuthService Initialized ===")
        print(f"Config SENDER_EMAIL: {self.config.SENDER_EMAIL}")
        print(f"Config EMAIL_PASSWORD: {'***SET***' if self.config.EMAIL_PASSWORD else '***NOT SET***'}")
        print(f"==============================")

    async def register_user(self, data: UserRegisterSchema) -> dict:
        """Регистрация нового пользователя с отправкой кода подтверждения на email"""
        try:
            # Validate email
            email_validator.validate_email(data.email)
        except email_validator.EmailNotValidError:
            raise EmailNotValidError()

        async with UnitOfWork() as uow:
            # Check if user already exists
            existing_user = await uow.users.select_user_by_email(data.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists",
                )

            # Check if username already exists
            existing_username = await uow.users.select_user_by_username(data.username)
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this username already exists",
                )

        # Generate verification code
        verify_code = generate_verification_code()
        
        # Hash password
        hashed_password = hash_password(data.password)
        logger.info(f"Registration: Password hashed successfully, hash length: {len(hashed_password)}")
        
        # Prepare user data for temporary storage
        user_data = {
            "email": data.email,
            "username": data.username,
            "password_hash": hashed_password
        }
        
        # Generate temporary token for this registration
        import secrets
        temp_token = secrets.token_urlsafe(32)
        
        # Save user data and verification code in Redis
        await self.redis_client.set_temp_user_data(temp_token, user_data, self.config.VERIFY_CODE_TTL)
        await self.redis_client.set_email_verify_code(temp_token, str(verify_code), self.config.VERIFY_CODE_TTL)
        
        # Send verification email
        try:
            send_response = await self.email_worker.send_email(data.email, verify_code)
            if send_response.get("status") == "error":
                # Clean up Redis data if email sending fails
                await self.redis_client.delete_temp_user_data(temp_token)
                await self.redis_client.delete_email_verify_code(temp_token)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to send verification email: {send_response.get('error', 'Unknown error')}"
                )
        except Exception as e:
            # Clean up Redis data if email sending fails
            await self.redis_client.delete_temp_user_data(temp_token)
            await self.redis_client.delete_email_verify_code(temp_token)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email"
            )

        return {
            "message": "Verification code sent to your email",
            "temp_token": temp_token,
            "email": data.email
        }

    async def confirm_registration(self, data: ConfirmRegisterSchema) -> dict:
        """Подтверждение регистрации пользователя"""
        # Check verification code
        is_valid_code = await self.redis_client.check_email_verify_code(data.temp_token, data.confirmation_code)
        if not is_valid_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid confirmation code"
            )

        # Get temporary user data by temp_token
        temp_user_data = await self.redis_client.get_temp_user_data(data.temp_token)
        if not temp_user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration data not found or expired"
            )

        async with UnitOfWork() as uow:
            # Double-check that user doesn't exist
            existing_user = await uow.users.select_user_by_email(temp_user_data["email"])
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this email already exists",
                )

            existing_username = await uow.users.select_user_by_username(temp_user_data["username"])
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this username already exists",
                )

            # Create user
            user_data = UserCreate(
                email=temp_user_data["email"],
                username=temp_user_data["username"],
                password_hash=temp_user_data["password_hash"]
            )

            user_id = await uow.users.insert_one(user_data)
            await uow.commit()

            # Clean up Redis data
            await self.redis_client.delete_temp_user_data(data.temp_token)
            await self.redis_client.delete_email_verify_code(data.temp_token)

            # Generate tokens for automatic login
            tokens = await self.generate_tokens(str(user_id))

            # Save refresh token to database
            await uow.users.set_refresh_token(user_id, tokens.refresh_token)

            return {
                "message": "User registered successfully",
                "user_id": user_id,
                "access_token": tokens.access_token,
                "refresh_token": tokens.refresh_token
            }

    async def login_user(self, data: UserLoginSchema) -> dict:
        """Логин пользователя"""
        try:
            # Validate email
            email_validator.validate_email(data.email)
        except email_validator.EmailNotValidError:
            raise EmailNotValidError()

        async with UnitOfWork() as uow:
            # Find user by email
            user = await uow.users.select_user_by_email(data.email)
            if not user:
                logger.warning(f"Login failed: User not found for email {data.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
                )

            logger.info(f"User found: {user.email}, checking password...")
            
            # Verify password
            password_valid = verify_password(data.password, user.password_hash)
            logger.info(f"Password verification result: {password_valid}")
            logger.info(f"Input password length: {len(data.password)}")
            logger.info(f"Stored hash length: {len(user.password_hash) if user.password_hash else 0}")
            
            if not password_valid:
                logger.warning(f"Login failed: Invalid password for user {data.email}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
                )

            # Сохраняем нужные значения пользователя до коммита
            user_id = user.id
            user_email = user.email
            user_username = user.username
            # Generate tokens
            tokens = await self.generate_tokens(str(user.id))

            # Save refresh token to database
            await uow.users.set_refresh_token(user.id, tokens.refresh_token)

            # Return tokens and user info
            return {
                "access_token": tokens.access_token,
                "refresh_token": tokens.refresh_token,
                "user": {
                    "id": user_id,
                    "email": user_email,
                    "username": user_username,
                }
            }

    async def get_user_profile(self, user_id: str) -> dict:
        """Получение профиля пользователя с дополнительной статистикой"""
        async with UnitOfWork() as uow:
            user = await uow.users.select_user_by_id(int(user_id))
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

            # Получаем агентов пользователя
            agents = await uow.agents.get_agents_by_owner(int(user_id))
            
            # Статистика агентов
            total_agents = len(agents)
            online_agents = len([a for a in agents if a.status == "online"])
            offline_agents = len([a for a in agents if a.status == "offline"])
            
            # Получаем активные задачи пользователя
            active_tasks = await uow.tasks.count_running_tasks_by_user_id(int(user_id))
            
            # Получаем количество агентов, которые сейчас выполняют задачи
            agents_in_work = await self._get_agents_in_work(uow, int(user_id))
            
            # Общая статистика заработка
            total_earnings = await uow.tasks.calculate_total_earnings_by_user_id(int(user_id))
            
            # Заработок за последние 24 часа - учитываем все задачи с total_cost
            earnings_24h_amount = await self._calculate_user_earnings_by_period(uow, int(user_id), days=1)
            
            # Заработок за последние 30 дней - учитываем все задачи с total_cost
            earnings_30d_amount = await self._calculate_user_earnings_by_period(uow, int(user_id), days=30)
            
            # Расчет средней загрузки агентов за 30 дней
            average_utilization = await self._calculate_average_agent_utilization(uow, int(user_id), agents)

            return {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "balance": user.balance,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "usdt_wallet": user.usdt_wallet,
                "statistics": {
                    "total_agents": total_agents,
                    "online_agents": online_agents,
                    "offline_agents": offline_agents,
                    "active_tasks": active_tasks,
                    "agents_in_work": agents_in_work,
                    "total_earnings": total_earnings or 0.0,
                    "earnings_24h": round(earnings_24h_amount, 2),
                    "earnings_30d": round(earnings_30d_amount, 2),
                    "average_utilization": average_utilization
                }
            }

    async def generate_tokens(self, user_id: str) -> TokenSchema:
        """Генерация JWT токенов"""

        access_token_expires = datetime.utcnow() + timedelta(days=7)
        refresh_token_expires = datetime.utcnow() + timedelta(days=90)

        sign_key = str(self.config.ACCESS_TOKEN_SECRET)
        if isinstance(sign_key, bytes):
            sign_key = sign_key.decode("utf-8")

        if isinstance(user_id, bytes):
            user_id = user_id.decode("utf-8")

        access_token = jwt.encode(
            {"user_id": user_id, "exp": access_token_expires}, sign_key, algorithm="HS256"
        )
        refresh_token = jwt.encode(
            {"user_id": user_id, "exp": refresh_token_expires}, sign_key, algorithm="HS256"
        )

        return TokenSchema(access_token=access_token, refresh_token=refresh_token)

    async def decode_access_token(self, token: str):
        """Decode the JWT access token to validate it."""
        try:
            payload = jwt.decode(token, self.config.ACCESS_TOKEN_SECRET, algorithms=["HS256"])
            return payload
        except jwt:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    async def refresh_token(self, refresh_token: str) -> TokenSchema:
        """Generate a new refresh token if the access token is valid."""
        payload = await self.decode_access_token(refresh_token)

        # Optionally, add checks on the payload, e.g., user roles, etc.
        user_id = payload.get("user_id")
        exp = payload.get("exp")

        now = datetime.now()
        exp = datetime.fromtimestamp(exp)

        # Вычисляем разницу между датами
        delta = exp - now
        if delta > timedelta(days=7):
            new_refresh_token_expires = datetime.utcnow() + timedelta(
                days=90
            )  # Set refresh token expiry
            refresh_token = jwt.encode(
                {"user_id": user_id, "exp": new_refresh_token_expires},
                self.config.ACCESS_TOKEN_SECRET,
                algorithm="HS256",
            )
        # Generate a new refresh token()
        new_access_token_expires = datetime.utcnow() + timedelta(days=7)  # Set refresh token expiry
        access_token = jwt.encode(
            {"user_id": user_id, "exp": new_access_token_expires},
            self.config.ACCESS_TOKEN_SECRET,
            algorithm="HS256",
        )
        expiration_seconds = int(
            (datetime.utcnow() + timedelta(days=7)).timestamp() - datetime.utcnow().timestamp()
        )
        await self.redis_client.set(f"user:{access_token}", refresh_token, ex=expiration_seconds)
        
        # Update refresh token in database
        async with UnitOfWork() as uow:
            await uow.users.set_refresh_token(int(user_id), refresh_token)
        
        tokens = TokenSchema(access_token=access_token, refresh_token=refresh_token)
        return tokens

    # Legacy methods for backward compatibility
    async def login(self, login_schema, response_model=ResponseSchema):
        if not check_number(login_schema.phone):
            raise PhoneNotCorrectError
        if not check_region(login_schema.phone, self.config.AVALIABLES_COUNTRY_CODES):
            raise RegionNotAvaliableError

        async with UnitOfWork() as uow:
            user = await uow.users.select_user_by_number(login_schema.phone)
            message_response: ResponseSchema = await self.send_verification_to_phone_number(
                login_schema.phone, login_schema.send_message_type
            )

            await self.redis_client.set_verify_code(
                str(tmp_sign_key), message_response.data["verify_code"], self.config.VERIFY_CODE_TTL
            )
            await self.redis_client.set_phone_number(
                str(tmp_sign_key), login_schema.phone, self.config.PHONE_NUMBER_TTL
            )
            await self.redis_client.set_temp_token(
                login_schema.phone, str(tmp_sign_key), self.config.TEMP_TOKEN_TTL
            )

            is_login = True if user else False
            return response_model(
                exception=0,
                data={
                    "sign_key": tmp_sign_key,
                    "is_login": is_login,
                },
            )

    async def confirm_login(
        self,
        sign_key: str,
        response_model=ResponseSchema,
    ):
        async with UnitOfWork() as uow:
            try:
                phone_number = await self.redis_client.get_phone_number(sign_key)
            except TypeError:
                raise UserNotExistError()

            user = await uow.users.select_user_by_number(phone_number)

            tokens = await self.generate_tokens(phone_number)

            if user:
                user.refresh_token = tokens.refresh_token

            else:
                insert_status = await uow.users.insert_one(
                    UserSchema(
                        refresh_token=str(tokens.refresh_token), phone_number=str(phone_number)
                    )
                )
                await uow.commit()
                tokens = await self.generate_tokens(phone_number)

            expiration_seconds = int(
                (datetime.utcnow() + timedelta(days=7)).timestamp() - datetime.utcnow().timestamp()
            )

            await self.redis_client.set_refresh_token(
                tokens.refresh_token, tokens.access_token, expiration_seconds=expiration_seconds
            )
            await self.redis_client.remove_temp_token_by_phone(phone_number)
            await self.redis_client.remove_phone_by_temp_token(sign_key)

        return tokens

    async def send_verification_to_phone_number(
        self,
        phone_number: str,
        mode: Literal["WhatsApp", "SMS Aero"] = None,
        verify_code: int = None,
        response_model=ResponseSchema,
    ) -> int:
        if not verify_code:
            verify_code = generate_verification_code()

        send_response = await self.sms_worker.send_sms(phone_number, verify_code, mode)

        send_response["verify_code"] = str(verify_code)

        return response_model(exception=0, data=send_response)

    async def confirm_verification_to_phone_number(
        self,
        temp_token: str,
        verify_code: str,
        response_model=ResponseSchema,
    ):
        try:
            verify_code_status = await self.redis_client.check_verify_code(temp_token, verify_code)
        except TypeError:
            return response_model(exception=667, data={"exception": "Error"}, message="Error")

        if verify_code_status:
            return response_model(exception=0, data={"sign_key": temp_token})
        else:
            return response_model(
                exception=666, data={"sign_key": temp_token}, message="Invalid code"
            )

    async def send_verification_to_email(
        self,
        access_token: str,
        email: str,
        verify_code: int = None,
        response_model=ResponseSchema,
    ):
        if not email_validator.validate_email(email):
            raise EmailNotValidError

        if not verify_code:
            verify_code = generate_verification_code()

        send_response = self.email_worker.send_email(email, verify_code)
        await self.redis_client.set(f"user:{access_token}:email", email)
        await self.redis_client.set(f"verify_code:{access_token}:email", verify_code)
        return response_model(exception=0, data={"send_response": send_response})

    async def confirm_verification_to_email(
        self,
        access_token: str,
        verify_code: str,
        response_model=ResponseSchema,
    ):
        sended_code = normalize_to_integer(
            await self.redis_client.get(f"verify_code:{access_token}:email")
        )
        await self.redis_client.delete(f"verify_code:{access_token}:phone_number")
        if int(verify_code) == int(sended_code):
            async with UnitOfWork() as uow:
                user = await uow.users.select_user_by_refresh_token(refresh_token)
                user.email = email
                await uow.users.update_by_refresh_token(refresh_token, user)
                await uow.commit()

            return response_model(exception=0, data={"sign_key": access_token})
        else:
            return response_model(exception=2, data={"message": "Пароль не совпадает"})

    async def update_username(self, user_id: int, new_username: str) -> dict:
        """Обновить username пользователя"""
        async with UnitOfWork() as uow:
            # Проверка, что username не занят
            existing_username = await uow.users.select_user_by_username(new_username)
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User with this username already exists",
                )
            # Обновление username
            from common_schemas import UserUpdate
            user_update = UserUpdate(username=new_username)
            updated_user = await uow.users.update_user(user_id, user_update)
            await uow.commit()
            return {"message": "Username updated successfully", "username": updated_user.username}

    async def update_usdt_wallet(self, user_id: int, usdt_wallet: str) -> dict:
        """Обновить USDT кошелек пользователя"""
        async with UnitOfWork() as uow:
            # Обновление USDT кошелька
            from common_schemas import UserUpdate
            user_update = UserUpdate(usdt_wallet=usdt_wallet)
            updated_user = await uow.users.update_user(user_id, user_update)
            await uow.commit()
            return {"message": "USDT wallet updated successfully", "usdt_wallet": updated_user.usdt_wallet}

    async def _calculate_user_earnings_by_period(self, uow: UnitOfWork, user_id: int, days: int) -> float:
        """Расчет заработка пользователя за указанный период на основе total_cost из tasks"""
        try:
            from datetime import datetime, timedelta
            from sqlalchemy import func, select, and_, or_
            from common_models import Task, TaskStatus
            
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Получаем сумму total_cost для всех задач пользователя за период
            # Учитываем задачи, которые:
            # 1. Завершены в указанный период (finished_at >= cutoff_date)
            # 2. ИЛИ созданы в указанный период и имеют total_cost (для предоплаченных задач)
            # 3. Не помечены как удаленные
            earnings_query = select(func.sum(Task.total_cost)).where(
                and_(
                    Task.user_id == user_id,
                    Task.total_cost.isnot(None),
                    Task.is_deleted == False,
                    or_(
                        Task.finished_at >= cutoff_date,  # Завершенные в период
                        and_(
                            Task.started_at >= cutoff_date,  # Созданные в период
                            Task.total_cost > 0  # С ненулевой стоимостью
                        )
                    )
                )
            )
            
            # Логируем SQL-запрос для отладки
            logger.info(f"Earnings query for user {user_id}: {earnings_query}")
            logger.info(f"Cutoff date: {cutoff_date}")
            
            result = await uow._session.execute(earnings_query)
            total_earnings = result.scalar() or 0.0
            
            # Добавляем логирование для отладки
            logger.info(f"Calculated earnings for user {user_id} over {days} days: {total_earnings}")
            
            return total_earnings
            
        except Exception as e:
            logger.error(f"Error calculating user earnings for user {user_id} over {days} days: {e}")
            return 0.0

    async def _calculate_average_agent_utilization(self, uow: UnitOfWork, user_id: int, agents: list) -> dict:
        """Расчет средней загрузки агентов за 30 дней"""
        if not agents:
            return {
                "utilization_percent": 0.0,
                "total_hours_available": 0,
                "total_hours_used": 0,
                "agents_count": 0
            }

        try:
            # Получаем статистику задач за 30 дней
            task_stats = await uow.task_history.get_task_statistics_by_user(user_id, days=30)
            
            # Общее время выполнения задач в часах
            total_duration_minutes = task_stats.get("total_duration_minutes", 0)
            total_hours_used = total_duration_minutes / 60.0
            
            # Общее доступное время агентов за 30 дней
            # 30 дней * 24 часа * количество агентов
            total_hours_available = 30 * 24 * len(agents)
            
            # Расчет процента загрузки
            utilization_percent = (total_hours_used / total_hours_available * 100) if total_hours_available > 0 else 0.0
            
            return {
                "utilization_percent": round(utilization_percent, 2),
                "total_hours_available": round(total_hours_available, 2),
                "total_hours_used": round(total_hours_used, 2),
                "agents_count": len(agents)
            }
            
        except Exception as e:
            # В случае ошибки возвращаем нулевые значения
            return {
                "utilization_percent": 0.0,
                "total_hours_available": 0,
                "total_hours_used": 0,
                "agents_count": len(agents)
            }

    async def _get_agents_in_work(self, uow: UnitOfWork, user_id: int) -> int:
        """Получение количества агентов, которые сейчас выполняют задачи"""
        try:
            # Получаем количество активных задач пользователя
            active_tasks = await uow.tasks.get_running_tasks_by_user_id(user_id)
            
            # Собираем уникальные agent_id из активных задач
            agents_in_work = set()
            for task in active_tasks:
                if task.agent_id:
                    agents_in_work.add(task.agent_id)
            
            return len(agents_in_work)
            
        except Exception as e:
            # В случае ошибки возвращаем 0
            return 0

    @staticmethod
    def get_current_user():
        """Получение текущего пользователя из JWT токена"""
        from fastapi import Depends
        from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
        
        security = HTTPBearer()
        
        async def _get_current_user(
            credentials: HTTPAuthorizationCredentials = Depends(security)
        ) -> UserProfileSchema:
            # Получаем данные пользователя из JWT
            user_data = await get_current_user_util(credentials)
            
            # Создаем экземпляр AuthService для получения полного профиля
            from v1.auth.config import AuthServiceConfig
            
            config = AuthServiceConfig()
            auth_service = AuthService(config)
            
            # Получаем полный профиль пользователя
            profile_data = await auth_service.get_user_profile(str(user_data["user_id"]))
            
            # Создаем и возвращаем UserProfileSchema
            return UserProfileSchema(**profile_data)
        
        return _get_current_user
