from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
import io
import csv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
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
from fastapi import HTTPException

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
        pinned=shipment.pinned,
    )
    return record


@router.patch("/{record_id}", response_model=TrackedShipment)
async def update_history(
    record_id: str,
    update: TrackedShipmentUpdate,
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    service = TrackingHistoryService(db)
    record = service.update_record(record_id, note=update.note, pinned=update.pinned)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.delete("/")
async def delete_history(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete all history items for the current user."""
    service = TrackingHistoryService(db)
    deleted = service.clear_history(current_user.id)
    return {"deleted": deleted}


@router.get("/export")
async def export_history(
    format: str = "csv",
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Export the user's history in CSV or PDF format."""
    service = TrackingHistoryService(db)
    records = service.get_history(current_user.id)

    if format.lower() == "pdf":
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        y = 750
        pdf.drawString(50, y, "Tracking history")
        y -= 20
        for rec in records:
            pdf.drawString(
                50,
                y,
                f"{rec.created_at} - {rec.tracking_number} - {rec.status or ''}",
            )
            y -= 15
            if y < 50:
                pdf.showPage()
                y = 750
        pdf.save()
        buffer.seek(0)
        headers = {"Content-Disposition": "attachment; filename=history.pdf"}
        return StreamingResponse(buffer, media_type="application/pdf", headers=headers)

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["created_at", "tracking_number", "status", "note", "pinned"])
    for rec in records:
        writer.writerow([
            rec.created_at,
            rec.tracking_number,
            rec.status,
            rec.note,
            rec.pinned,
        ])
    out.seek(0)
    headers = {"Content-Disposition": "attachment; filename=history.csv"}
    return StreamingResponse(io.BytesIO(out.getvalue().encode()), media_type="text/csv", headers=headers)
