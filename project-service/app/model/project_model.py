from datetime import datetime
from enum import Enum
from typing import Annotated, Optional
from coolname import generate_slug

from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]


class KernelStatus(str, Enum):
    DISCONNECTED = "disconnected"
    CONNECTED = "connected"
    CONNECTING = "connecting"
    ERROR = "error"


class Project(BaseModel):
    id: PyObjectId = Field(alias="_id", serialization_alias="id", default=None)
    kernel_id: Optional[str] = None
    kernel_url: Optional[str] = None
    kernel_status: KernelStatus = KernelStatus.DISCONNECTED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    name: str = Field(default_factory=generate_slug)
    graph: Optional[object] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
