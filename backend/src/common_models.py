from sqlalchemy import BigInteger, String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.postgres.postgres_client import Base
from typing import TypeVar
from sqlalchemy.dialects.postgresql import JSONB

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

from sqlalchemy import ForeignKey, String, Text, DateTime, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship


Model = TypeVar("Model", bound=BaseModel)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    refresh_token: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)

    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Animal(Base):
    __tablename__ = "animals"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    animal: Mapped[str] = mapped_column(String, nullable=False)  # Тип животного
    name: Mapped[str] = mapped_column(String, nullable=False)    # Имя животного

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Связь с транскрипциями
    transcriptions: Mapped[List["AnimalTranscription"]] = relationship(
        "AnimalTranscription", back_populates="animal", cascade="all, delete-orphan"
    )


class AnimalTranscription(Base):
    __tablename__ = "animal_transcriptions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    animal_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("animals.id"), nullable=False)
    
    # Поведение/состояние (с историей)
    behavior_state: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Детализированные параметры (измерения животного - вес, температура)
    measurements: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Детали кормления (пища, количество)
    feeding_details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Взаимоотношения с другими животными
    relationships: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Связь с животным
    animal: Mapped["Animal"] = relationship("Animal", back_populates="transcriptions")
