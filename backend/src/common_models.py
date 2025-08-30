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
    refresh_token: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    password: Mapped[str] = mapped_column(String, nullable=True)

    balance: Mapped[int] = mapped_column(Integer, default=0)
    added_date: Mapped[str] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    searches: Mapped[List["Search"]] = relationship("Search", back_populates="user")

class Search(Base):
    __tablename__ = "searches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    vc_website_url: Mapped[Optional[str]] = mapped_column(String)
    company_name: Mapped[Optional[str]] = mapped_column(String)
    company_description: Mapped[Optional[str]] = mapped_column(String)
    outreach: Mapped[Optional[str]] = mapped_column(Text)
    first_search: Mapped[Optional[str]] = mapped_column(Text)
    leads: Mapped[Optional[str]] = mapped_column(Text)
    anal_list: Mapped[Optional[str]] = mapped_column(Text)
    qa_anal: Mapped[Optional[str]] = mapped_column(Text)
    full_partner_info: Mapped[Optional[str]] = mapped_column(Text)
    outreach_letter: Mapped[Optional[str]] = mapped_column(Text)
    outreach_letter_qa: Mapped[Optional[str]] = mapped_column(Text)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="searches")
    task_outputs: Mapped[List["TaskOutput"]] = relationship("TaskOutput", back_populates="search")
    decision_makers: Mapped[List["DecisionMaker"]] = relationship("DecisionMaker", back_populates="search")

    model_config = ConfigDict(from_attributes=True)


class TaskOutput(Base):
    __tablename__ = "task_outputs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    search_id: Mapped[int] = mapped_column(Integer, ForeignKey("searches.id"))
    workflow_step: Mapped[Optional[str]] = mapped_column(String)
    data: Mapped[Optional[JSONB]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    search: Mapped["Search"] = relationship("Search", back_populates="task_outputs")


class DecisionMaker(Base):
    __tablename__ = "decision_makers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    search_id: Mapped[int] = mapped_column(Integer, ForeignKey("searches.id"))
    first_name: Mapped[Optional[str]] = mapped_column(String)
    last_name: Mapped[Optional[str]] = mapped_column(String)
    position: Mapped[Optional[str]] = mapped_column(String)
    personal_information: Mapped[Optional[str]] = mapped_column(Text)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String)
    x_url: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    search: Mapped["Search"] = relationship("Search", back_populates="decision_makers")
