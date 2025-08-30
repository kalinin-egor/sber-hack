from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BaseSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


Schema = TypeVar("Schema", bound=BaseSchema)


# Enums
class AgentStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ERROR = "error"
    BUSY = "busy"


class TaskStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOP_REQUESTED = "STOP_REQUESTED"
    DELETE_REQUESTED = "DELETE_REQUESTED"


# Removed TaskOperation; control flow is encoded via TaskStatus only


class DiskType(str, Enum):
    SSD = "SSD"
    NVME = "NVMe"
    HDD = "HDD"


# User schemas
class UserSchema(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    username: str
    password_hash: str
    registered_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password_hash: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    password_hash: Optional[str] = None
    balance: Optional[int] = None
    is_active: Optional[bool] = None
    usdt_wallet: Optional[str] = None


# Agent schemas
class AgentSchema(BaseSchema):
    id: Optional[int] = None
    owner_user_id: int
    hostname: str
    location: str
    status: AgentStatus = AgentStatus.OFFLINE
    ip_address: Optional[str] = None
    price_per_hour: float
    verified: bool = False
    reliability: float = 0.0
    max_duration_hours: Optional[int] = None
    created_at: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    total_ram_gb: int
    ram_type: str
    # Resource totals
    ram_total: Optional[int] = None
    storage_total: Optional[int] = None
    cpu_cores_total: Optional[int] = None
    gpu_total: Optional[int] = None
    gpu_available: Optional[int] = None
    secret_key: Optional[str] = None
    available_ports_start: Optional[int] = None
    available_ports_end: Optional[int] = None
    is_deleted: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class AgentCreate(BaseSchema):
    owner_user_id: int
    hostname: str
    location: str
    price_per_hour: float
    max_duration_hours: Optional[int] = None
    total_ram_gb: int
    ram_type: str
    ip_address: Optional[str] = None
    secret_key: str
    # Resource totals
    ram_total: Optional[int] = None
    storage_total: Optional[int] = None
    cpu_cores_total: Optional[int] = None
    gpu_total: Optional[int] = None
    gpu_available: Optional[int] = None
    available_ports_start: Optional[int] = None
    available_ports_end: Optional[int] = None


class AgentUpdate(BaseSchema):
    hostname: Optional[str] = None
    location: Optional[str] = None
    status: Optional[AgentStatus] = None
    ip_address: Optional[str] = None
    price_per_hour: Optional[float] = None
    verified: Optional[bool] = None
    reliability: Optional[float] = None
    max_duration_hours: Optional[int] = None
    last_seen: Optional[datetime] = None
    total_ram_gb: Optional[int] = None
    ram_type: Optional[str] = None
    # Resource totals
    ram_total: Optional[int] = None
    storage_total: Optional[int] = None
    cpu_cores_total: Optional[int] = None
    gpu_total: Optional[int] = None
    gpu_available: Optional[int] = None
    secret_key: Optional[str] = None
    available_ports_start: Optional[int] = None
    available_ports_end: Optional[int] = None
    is_deleted: Optional[bool] = None


# CPU schemas
class CPUSchema(BaseModel):
    id: Optional[int] = None
    agent_id: int
    model: str
    cores: int
    threads: int
    frequency_ghz: Optional[float] = Field(None, alias="freq_ghz")  # Маппинг с freq_ghz из БД
    temperature_c: Optional[int] = None
    count: int = 1

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class CPUCreate(BaseModel):
    agent_id: int
    model: str
    cores: int
    threads: int
    freq_ghz: Optional[float] = None
    temperature_c: Optional[int] = None
    count: int = 1


class CPUUpdate(BaseModel):
    model: Optional[str] = None
    cores: Optional[int] = None
    threads: Optional[int] = None
    freq_ghz: Optional[float] = None
    temperature_c: Optional[int] = None
    count: Optional[int] = None


# GPU schemas
class GPUSchema(BaseModel):
    id: Optional[int] = None
    agent_id: int
    model: str
    vram_gb: int
    architecture: Optional[str] = None  # Например: "Ada Lovelace", "Ampere"
    cuda_cores: Optional[int] = None
    tensor_cores: Optional[str] = None  # Например: "4th Gen"
    memory_bandwidth_gbps: Optional[float] = None
    driver_version: Optional[str] = None
    cuda_version: Optional[str] = None
    temperature_c: Optional[int] = None
    power_w: Optional[int] = None
    performance_fp16_tflops: Optional[float] = None
    performance_fp32_tflops: Optional[float] = None
    max_cuda_version: Optional[str] = None  # Legacy поле
    tflops: Optional[float] = None  # Legacy поле
    bandwidth_gbps: Optional[float] = None  # Legacy поле
    count: int = 1

    model_config = ConfigDict(from_attributes=True)


class GPUCreate(BaseModel):
    agent_id: int
    model: str
    vram_gb: int
    tflops: Optional[float] = None
    bandwidth_gbps: Optional[float] = None
    max_cuda_version: Optional[str] = None
    count: int = 1


class GPUUpdate(BaseModel):
    model: Optional[str] = None
    vram_gb: Optional[int] = None
    max_cuda_version: Optional[str] = None
    tflops: Optional[float] = None
    bandwidth_gbps: Optional[float] = None
    count: Optional[int] = None


# Disk schemas
class DiskSchema(BaseModel):
    id: Optional[int] = None
    agent_id: int
    model: str
    type: DiskType
    capacity_gb: Optional[int] = Field(None, alias="size_gb")  # Маппинг с size_gb из БД
    provider: Optional[str] = None  # Например: "Samsung", "Western Digital"
    read_speed_mb_s: Optional[int] = None
    write_speed_mb_s: Optional[int] = None
    size_gb: Optional[int] = None  # Legacy поле

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DiskCreate(BaseModel):
    agent_id: int
    model: str
    type: DiskType
    size_gb: int
    read_speed_mb_s: Optional[int] = None
    write_speed_mb_s: Optional[int] = None


class DiskUpdate(BaseModel):
    model: Optional[str] = None
    type: Optional[DiskType] = None
    size_gb: Optional[int] = None
    read_speed_mb_s: Optional[int] = None
    write_speed_mb_s: Optional[int] = None


# Network schemas
class NetworkSchema(BaseModel):
    id: Optional[int] = None
    agent_id: int
    provider: Optional[str] = None  # Например: "OVH Montreal", "AWS"
    speed_gbps: Optional[float] = None  # Скорость в Gbps
    latency_ms: Optional[float] = None  # Задержка в миллисекундах
    up_mbps: int  # Legacy поле
    down_mbps: int  # Legacy поле
    ports: Optional[str] = None  # Legacy поле

    model_config = ConfigDict(from_attributes=True)


class NetworkCreate(BaseModel):
    agent_id: int
    up_mbps: int = 0
    down_mbps: int = 0
    ports: Optional[str] = None


class NetworkUpdate(BaseModel):
    up_mbps: Optional[int] = None
    down_mbps: Optional[int] = None
    ports: Optional[str] = None


# Task schemas
class TaskSchema(BaseModel):
    id: Optional[int] = None
    agent_id: int
    user_id: int
    gpu_required: Optional[int] = None
    gpu_enabled_indices: Optional[List[int]] = None
    docker_image: str
    container_id: Optional[str] = None
    # SSH connection information
    ssh_host: Optional[str] = None
    ssh_port: Optional[int] = None
    container_name: Optional[str] = None
    ssh_password: Optional[str] = None
    status: TaskStatus = TaskStatus.QUEUED
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    price_per_hour: float
    total_cost: Optional[float] = None
    is_deleted: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True)


class TaskCreate(BaseModel):
    agent_id: int
    user_id: int
    gpu_required: Optional[int] = None
    gpu_enabled_indices: Optional[List[int]] = None
    docker_image: str
    container_id: Optional[str] = None
    container_name: Optional[str] = None
    price_per_hour: float
    total_cost: float


class TaskUpdate(BaseModel):
    gpu_required: Optional[int] = None
    gpu_enabled_indices: Optional[List[int]] = None
    docker_image: Optional[str] = None
    container_id: Optional[str] = None
    # SSH connection information
    ssh_host: Optional[str] = None
    ssh_port: Optional[int] = None
    container_name: Optional[str] = None
    ssh_password: Optional[str] = None
    status: Optional[TaskStatus] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    price_per_hour: Optional[float] = None
    total_cost: Optional[float] = None
    is_deleted: Optional[bool] = None


# TaskHistory schemas
class TaskHistorySchema(BaseModel):
    id: Optional[int] = None
    task_id: int
    agent_id: int
    user_id: int
    
    # Основные данные задачи
    gpus_allocated: Optional[Dict[str, Any]] = None
    cpus_allocated: Optional[Dict[str, Any]] = None
    disks_allocated: Optional[Dict[str, Any]] = None
    ram_allocated: int
    storage_allocated: int
    net_up_allocated: int
    net_down_allocated: int
    docker_image: str
    container_id: Optional[str] = None
    
    # Финансовые данные
    price_per_hour: float
    total_cost: Optional[float] = None
    
    # Временные метки
    planned_start_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    planned_finish_date: Optional[datetime] = None
    actual_finish_date: Optional[datetime] = None
    
    # Статус и метаданные
    status: TaskStatus
    duration_minutes: Optional[int] = None
    created_at: Optional[datetime] = None
    
    # Дополнительные поля для аналитики
    failure_reason: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class TaskHistoryCreate(BaseModel):
    task_id: int
    agent_id: int
    user_id: int
    
    # Основные данные задачи
    gpus_allocated: Optional[Dict[str, Any]] = None
    cpus_allocated: Optional[Dict[str, Any]] = None
    disks_allocated: Optional[Dict[str, Any]] = None
    ram_allocated: int
    storage_allocated: int
    net_up_allocated: int
    net_down_allocated: int
    docker_image: str
    container_id: Optional[str] = None
    
    # Финансовые данные
    price_per_hour: float
    total_cost: Optional[float] = None
    
    # Временные метки
    planned_start_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    planned_finish_date: Optional[datetime] = None
    actual_finish_date: Optional[datetime] = None
    
    # Статус и метаданные
    status: TaskStatus
    duration_minutes: Optional[int] = None
    
    # Дополнительные поля для аналитики
    failure_reason: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None


class TaskHistoryUpdate(BaseModel):
    # Основные данные задачи
    gpus_allocated: Optional[Dict[str, Any]] = None
    cpus_allocated: Optional[Dict[str, Any]] = None
    disks_allocated: Optional[Dict[str, Any]] = None
    ram_allocated: Optional[int] = None
    storage_allocated: Optional[int] = None
    net_up_allocated: Optional[int] = None
    net_down_allocated: Optional[int] = None
    docker_image: Optional[str] = None
    container_id: Optional[str] = None
    
    # Финансовые данные
    price_per_hour: Optional[float] = None
    total_cost: Optional[float] = None
    
    # Временные метки
    planned_start_date: Optional[datetime] = None
    actual_start_date: Optional[datetime] = None
    planned_finish_date: Optional[datetime] = None
    actual_finish_date: Optional[datetime] = None
    
    # Статус и метаданные
    status: Optional[TaskStatus] = None
    duration_minutes: Optional[int] = None
    
    # Дополнительные поля для аналитики
    failure_reason: Optional[str] = None
    performance_metrics: Optional[Dict[str, Any]] = None


# Agent with full details schema
class AgentWithDetailsSchema(AgentSchema):
    cpus: List[CPUSchema] = []
    gpus: List[GPUSchema] = []
    disks: List[DiskSchema] = []
    networks: List[NetworkSchema] = []
    secret_key: Optional[str] = None
    
    # Дополнительные поля для marketplace
    availability: Optional[float] = None  # Доступность агента (0.0 - 1.0)
    demand_type: Optional[str] = "on_demand"  # on_demand или reserved
    instances_available: Optional[int] = None  # Количество доступных инстансов
    time_since_last_seen_seconds: Optional[int] = None  # Время с последнего heartbeat
    runtime_minutes: Optional[int] = None  # Общее время работы в минутах
    earnings_total_usd: Optional[float] = None  # Общий заработок в USD


class AgentListResponseSchema(BaseModel):
    """Схема для ответа списка агентов в новом формате"""
    id: int
    hostname: str
    status: str
    price_per_hour: float
    verified: bool
    reliability: float
    created_at: datetime
    last_seen: Optional[datetime] = None
    
    # GPU информация
    gpu_count: int = 0
    gpu_model: Optional[str] = None
    vram_gb: int = 0
    
    # RAM информация
    ram_gb: int
    ram_type: str
    
    # CPU информация
    cpu_temperature: Optional[int] = None
    cpu_count: int = 0
    cpu_model: Optional[str] = None
    
    # Диски
    storage_gb: int = 0
    storage_model: Optional[str] = None
    
    # Сеть
    up_mbps: int = 0
    down_mbps: int = 0
    
    # Локация
    location: str
    
    # Дополнительные поля
    availability: float = 0.0
    demand_type: str = "on_demand"
    instances_available: int = 0
    time_since_last_seen_seconds: int = 0
    runtime_minutes: int = 0
    earnings_total_usd: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)


# Legacy schemas for backward compatibility
class TaskOutputSchema(BaseModel):
    id: Optional[int] = None
    search_id: int
    workflow_step: Optional[str] = None
    data: Optional[Any] = None  # Можно указать dict, если всегда получаем JSON объект
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DecisionMakerSchema(BaseModel):
    id: Optional[int] = None
    search_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    personal_information: Optional[str] = None
    linkedin_url: Optional[str] = None
    x_url: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenSchema(BaseSchema):
    access_token: str
    refresh_token: str


class ResponseSchema(BaseModel):
    exception: Optional[int] = None
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SearchBase(BaseModel):
    user_id: int
    vc_website_url: Optional[str] = None
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    outreach: Optional[str] = None
    first_search: Optional[str] = None
    leads: Optional[str] = None
    anal_list: Optional[str] = None
    qa_anal: Optional[str] = None
    full_partner_info: Optional[str] = None
    outreach_letter: Optional[str] = None
    outreach_letter_qa: Optional[str] = None
    status: str = "PENDING"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    error_message: Optional[str] = None


class SearchCreate(BaseModel):
    user_id: int  # Обязательное поле
    vc_website_url: Optional[str] = None
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    outreach: Optional[str] = None
    # Другие поля, которые нужны для создания записи

    model_config = ConfigDict(from_attributes=True)


class SearchUpdate(BaseModel):
    """Схема для обновления данных в Search."""

    vc_website_url: Optional[str] = None
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    outreach: Optional[str] = None
    first_search: Optional[str] = None
    leads: Optional[str] = None
    anal_list: Optional[str] = None
    qa_anal: Optional[str] = None
    full_partner_info: Optional[str] = None
    outreach_letter: Optional[str] = None
    outreach_letter_qa: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    error_message: Optional[str] = None


class SearchInDBBase(SearchBase):
    id: Optional[int] = None  # Делаем id необязательным
    model_config = ConfigDict(from_attributes=True)


class SearchSchema(SearchInDBBase):
    """Схема для возврата данных Search из базы."""

    # Если необходимо добавить вложенные данные (например, связи с User, DecisionMaker),
    # их можно добавить здесь как поля с соответствующими схемами.
    model_config = ConfigDict(from_attributes=True)
