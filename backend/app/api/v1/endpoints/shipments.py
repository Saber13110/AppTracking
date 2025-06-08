from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
from ....models.tracking import TrackingFilter
from ....services.tracking_service import TrackingService
from ....database import get_db
import csv
import io
import xml.etree.ElementTree as ET
import openpyxl
from fastapi.responses import StreamingResponse

router = APIRouter()

@router.post("/search", response_model=Dict[str, Any])
async def search_shipments(filters: TrackingFilter, db: Session = Depends(get_db)):
    service = TrackingService(db)
    try:
        results, total = service.search_trackings(filters)
        return {
            "items": results,
            "total": total,
            "page": filters.page,
            "page_size": filters.page_size,
            "total_pages": (total + filters.page_size - 1) // filters.page_size,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export")
async def export_shipments(
    filters: TrackingFilter,
    format: str = "csv",
    db: Session = Depends(get_db),
):
    service = TrackingService(db)
    results, _ = service.search_trackings(filters)
    if format == "csv":
        out = io.StringIO()
        writer = csv.writer(out)
        writer.writerow(["tracking_number", "status", "carrier"])
        for r in results:
            writer.writerow([r.tracking_number, r.status, r.carrier])
        out.seek(0)
        return StreamingResponse(
            io.BytesIO(out.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=shipments.csv"},
        )
    if format == "xml":
        root = ET.Element("shipments")
        for r in results:
            item = ET.SubElement(root, "shipment")
            ET.SubElement(item, "tracking_number").text = r.tracking_number
            ET.SubElement(item, "status").text = r.status
            ET.SubElement(item, "carrier").text = r.carrier
        data = ET.tostring(root, encoding="utf-8")
        return StreamingResponse(
            io.BytesIO(data),
            media_type="application/xml",
            headers={"Content-Disposition": "attachment; filename=shipments.xml"},
        )
    if format == "excel":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(["tracking_number", "status", "carrier"])
        for r in results:
            ws.append([r.tracking_number, r.status, r.carrier])
        bio = io.BytesIO()
        wb.save(bio)
        bio.seek(0)
        return StreamingResponse(
            bio,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=shipments.xlsx"},
        )
    raise HTTPException(status_code=400, detail="Unsupported format")
