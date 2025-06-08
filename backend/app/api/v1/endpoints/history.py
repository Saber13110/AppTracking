from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....services.auth import get_current_active_user
from ....database import get_db
from ....models.user import UserDB
from ....services.tracking_history_service import TrackingHistoryService
from ....models.tracking_history import (
    TrackedShipment,
    TrackedShipmentCreate,
    TrackedShipmentUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[TrackedShipment])
async def get_history(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = TrackingHistoryService(db)
    records = service.get_history(current_user.id)
    return records


@router.post("/", response_model=TrackedShipment)
async def add_history(
    shipment: TrackedShipmentCreate,
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = TrackingHistoryService(db)
    record = service.log_search(
        user_id=current_user.id,
        tracking_number=shipment.tracking_number,
        status=shipment.status,
        meta_data=shipment.meta_data,
        note=shipment.note,
        nickname=shipment.nickname,
        favorite=shipment.favorite,
    )
    return record


@router.patch("/{entry_id}", response_model=TrackedShipment)
async def update_history(
    entry_id: str,
    update: TrackedShipmentUpdate,
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = TrackingHistoryService(db)
    record = service.update_entry(entry_id, **update.dict(exclude_unset=True))
    if not record:
        raise HTTPException(status_code=404, detail="Entry not found")
    return record
