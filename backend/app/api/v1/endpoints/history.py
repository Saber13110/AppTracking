from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ....services.auth import get_current_active_user
from ....database import get_db
from ....models.user import UserDB
from ....services.tracking_history_service import TrackingHistoryService
from ....models.tracking_history import TrackedShipment
from pydantic import BaseModel
import io
import csv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

router = APIRouter()


class HistoryUpdate(BaseModel):
    pinned: bool | None = None
    note: str | None = None

@router.get("/", response_model=list[TrackedShipment])
async def get_history(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TrackingHistoryService(db)
    records = service.get_history(current_user.id)
    return records


@router.get("/export")
async def export_history(
    format: str = "csv",
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TrackingHistoryService(db)
    records = service.get_history(current_user.id)

    if format.lower() == "pdf":
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        y = 750
        pdf.drawString(50, y, "Tracking history")
        y -= 20
        for r in records:
            text = f"{r.created_at} - {r.tracking_number}"
            if r.note:
                text += f" - {r.note}"
            pdf.drawString(50, y, text)
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
    writer.writerow(["created_at", "tracking_number", "pinned", "note"])
    for r in records:
        writer.writerow([r.created_at, r.tracking_number, r.pinned, r.note or ""])
    out.seek(0)
    headers = {"Content-Disposition": "attachment; filename=history.csv"}
    return StreamingResponse(io.BytesIO(out.getvalue().encode()), media_type="text/csv", headers=headers)


@router.delete("/")
async def clear_history(
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TrackingHistoryService(db)
    service.delete_all(current_user.id)
    return {"success": True}


@router.patch("/{record_id}", response_model=TrackedShipment)
async def update_history_record(
    record_id: str,
    update: HistoryUpdate,
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    service = TrackingHistoryService(db)
    record = service.update_record(record_id, current_user.id, pinned=update.pinned, note=update.note)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record
