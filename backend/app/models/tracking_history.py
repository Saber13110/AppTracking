from datetime import datetime
from pydantic import BaseModel

class TrackedShipment(BaseModel):
    id: str
    tracking_number: str
    created_at: datetime

    class Config:
        from_attributes = True
