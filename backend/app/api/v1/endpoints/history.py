from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ....services.auth import get_current_active_user
from ....database import get_db
from ....models.user import UserDB
from ....services.tracking_history_service import TrackingHistoryService
from ....models.tracking_history import TrackedShipment

router = APIRouter()

@router.get("/", response_model=list[TrackedShipment])
async def get_history(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TrackingHistoryService(db)
    records = service.get_history(current_user.id)
    return records
