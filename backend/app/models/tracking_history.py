from datetime import datetime
from pydantic import BaseModel

class TrackedShipment(BaseModel):
    id: str
    tracking_number: str
    pinned: bool = False
    note: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
