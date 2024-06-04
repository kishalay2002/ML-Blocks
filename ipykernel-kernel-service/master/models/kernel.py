from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from .model import PyObjectId


class KernelStatus(str, Enum):
    STARTING = "starting"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


class KernelModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None, serialization_alias="id")
    container_id: Optional[str] = None
    container_image: str
    url: Optional[str] = None
    status: KernelStatus = KernelStatus.STARTING
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
