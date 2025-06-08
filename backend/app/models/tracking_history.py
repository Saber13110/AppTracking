from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class TrackedShipmentCreate(BaseModel):
    tracking_number: str
    status: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    note: Optional[str] = None
    pinned: Optional[bool] = False


class TrackedShipment(BaseModel):
    id: str
    tracking_number: str
    status: Optional[str] = None
    meta_data: Dict[str, Any] = Field(default_factory=dict)
    note: Optional[str] = None
    pinned: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class TrackedShipmentUpdate(BaseModel):
    note: Optional[str] = None
    pinned: Optional[bool] = None
