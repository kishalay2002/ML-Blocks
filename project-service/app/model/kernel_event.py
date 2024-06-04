from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KernelEvent(BaseModel):
    type: str
    timestamp: datetime
    kernel_id: str
    status: str
    kernel_url: Optional[str] = None
    error: Optional[str] = None
