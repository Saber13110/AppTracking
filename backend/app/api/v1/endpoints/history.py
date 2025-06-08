from fastapi import APIRouter, Depends
from fastapi import Query, HTTPException
from sqlalchemy.orm import Session
from ....services.auth import get_current_active_user
from ....database import get_db
from ....models.user import UserDB
from ....services.tracking_history_service import TrackingHistoryService
from ....models.tracking_history import TrackedShipment, TrackedShipmentCreate
import io
import csv
from typing import List
from openpyxl import Workbook
import xml.etree.ElementTree as ET
from fastapi.responses import StreamingResponse

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
    )
    return record


@router.get("/export")
async def export_history(
    format: str = "csv",
    status: str | None = None,
    ids: List[str] | None = Query(None),
    current_user: UserDB = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Export tracking history records."""
    fmt = format.lower()
    if fmt not in {"csv", "excel", "xml"}:
        raise HTTPException(status_code=400, detail="Invalid format")

    service = TrackingHistoryService(db)
    records = service.get_history(current_user.id)

    # Apply filters
    if ids:
        records = [r for r in records if r.tracking_number in ids]
    if status:
        records = [r for r in records if r.status == status]

    headers = [
        "tracking_number",
        "status",
        "weight",
        "dimensions",
        "service_type",
        "sender",
        "recipient",
    ]

    rows = []
    for r in records:
        meta = r.meta_data or {}
        rows.append([
            r.tracking_number,
            r.status or "",
            meta.get("weight", ""),
            meta.get("dimensions", ""),
            meta.get("service_type", ""),
            meta.get("sender", ""),
            meta.get("recipient", ""),
        ])

    if fmt == "csv":
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(headers)
        writer.writerows(rows)
        out.seek(0)
        return StreamingResponse(
            io.BytesIO(out.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=history.csv"},
        )

    if fmt == "excel":
        wb = Workbook()
        ws = wb.active
        ws.append(headers)
        for row in rows:
            ws.append(row)
        stream = io.BytesIO()
        wb.save(stream)
        stream.seek(0)
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=history.xlsx"},
        )

    # xml
    root = ET.Element("records")
    for row in rows:
        rec = ET.SubElement(root, "record")
        for h, v in zip(headers, row):
            elem = ET.SubElement(rec, h)
            elem.text = str(v)
    xml_bytes = ET.tostring(root, encoding="utf-8")
    return StreamingResponse(
        io.BytesIO(xml_bytes),
        media_type="application/xml",
        headers={"Content-Disposition": "attachment; filename=history.xml"},
    )
