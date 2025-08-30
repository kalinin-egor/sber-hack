from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class AuthServiceConfig(BaseSettings):
    """Конфигурация для сервиса аутентификации"""

    # Token configuration
    ACCESS_TOKEN_EXPIRATION_MINUTES: int = Field(default=30, ge=1)
    REFRESH_TOKEN_EXPIRATION_DAYS: int = Field(default=7, ge=1)
    ACCESS_TOKEN_SECRET: str = Field(default="your-access-secret-key")
    REFRESH_TOKEN_SECRET: str = Field(default="your-refresh-secret-key")
    
    # Legacy fields for backward compatibility
    secret_key: str = Field(default="your-secret-key")
    algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=30)
    refresh_token_expire_days: int = Field(default=7)
    
    # Redis configuration
    redis_url: str = Field(default="redis://localhost:6379")
    redis_db: int = Field(default=0)
    redis_password: str = Field(default="")
    redis_ssl: bool = Field(default=False)
    redis_ssl_cert_reqs: str = Field(default="required")
    redis_ssl_ca_certs: str = Field(default="")
    redis_ssl_certfile: str = Field(default="")
    redis_ssl_keyfile: str = Field(default="")
    redis_ssl_check_hostname: bool = Field(default=True)

    # Email configuration
    SENDER_EMAIL: str = Field(default="hello@personiqo.com")
    EMAIL_PASSWORD: str = Field(default="btpu tfym fsob qbdz")
    SMTP_HOST: str = Field(default="smtp.gmail.com")
    SMTP_PORT: int = Field(default=587)  # Gmail STARTTLS port
    EMAIL_USE_TLS: bool = Field(default=True)

    # SMS configuration
    SMS_API_EMAIL: str = Field(default="")
    SMS_API_KEY: str = Field(default="")
    BASE_SMS_API_URL: str = Field(default="")
    SMS_ENDPOINT_SEND_MESSAGE: str = Field(default="")
    SMS_ENDPOINT_BALANCE: str = Field(default="")

    # Дополнительные TTL и коды стран
    VERIFY_CODE_TTL: int = Field(default=300)  # 5 minutes
    PHONE_NUMBER_TTL: int = Field(default=300)  # 5 minutes
    TEMP_TOKEN_TTL: int = Field(default=300)  # 5 minutes
    AVALIABLES_COUNTRY_CODES: list = Field(default=["7", "1", "44", "49"])

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent.parent.parent.joinpath(".env"), 
        extra="ignore"
    )
