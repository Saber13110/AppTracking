from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from fastapi.responses import StreamingResponse
import httpx
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ....models.tracking import (
    TrackingResponse, TrackingFilter
)
from ....services.tracking_service import TrackingService
from ....database import get_db
from ....services.colis_service import ColisService
from ....services.fedex_service import FedExService
from ....services.tracking_history_service import TrackingHistoryService
from ....services.auth import oauth2_scheme, get_current_user
from datetime import datetime
import logging
import io
import csv
from ....models.colis import ColisCreate
from PIL import Image
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

router = APIRouter()
logger = logging.getLogger(__name__)

class TrackingRequest(BaseModel):
    tracking_number: str
    customer_name: Optional[str] = None
    note: Optional[str] = None

class BatchTrackingRequest(BaseModel):
    tracking_numbers: List[str]


class TrackByEmailRequest(BaseModel):
    tracking_number: str
    email: str

@router.post("/create", response_model=TrackingResponse)
async def create_package(
    colis_data: ColisCreate,
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme)
):
    """
    Create a new package with the given FedEx ID
    """
    try:
        colis_service = ColisService(db)
        
        # Create the colis
        colis = colis_service.create_colis(colis_data)
        
        if not colis:
            return TrackingResponse(
                success=False,
                data=None,
                error="Failed to create package",
                metadata={
                    "timestamp": datetime.now().isoformat(),
                    "identifier": colis_data.id
                }
            )

        # Track the newly created package
        fedex_service = FedExService()
        response = await fedex_service.track_package(colis.id)

        # Add metadata about the identifier used
        if response.metadata:
            response.metadata["identifier"] = colis.id
            response.metadata["identifier_type"] = "fedex_id"
            response.metadata["reference"] = colis.reference
            response.metadata["tcn"] = colis.tcn
            response.metadata["code_barre"] = colis.code_barre
        else:
            response.metadata = {
                "timestamp": datetime.now().isoformat(),
                "identifier": colis.id,
                "identifier_type": "fedex_id",
                "reference": colis.reference,
                "tcn": colis.tcn,
                "code_barre": colis.code_barre
            }

        if request:
            try:
                user = await get_current_user(request, db, token)
                TrackingHistoryService(db).log_search(user.id, colis_data.id)
            except Exception:
                pass

        return response

    except Exception as e:
        logger.error(f"Error creating package: {str(e)}")
        return TrackingResponse(
            success=False,
            data=None,
            error=str(e),
            metadata={
                "timestamp": datetime.now().isoformat(),
                "identifier": colis_data.id
            }
        )

@router.get("/{identifier}", response_model=TrackingResponse)
async def track_package(
    identifier: str,
    request: Request,
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme)
):
    """
    Track a single package by any identifier (FedEx ID, reference, TCN, or barcode)
    """
    try:
        colis_service = ColisService(db)
        fedex_service = FedExService()

        # Try to find the colis using any identifier type
        colis = colis_service.get_colis_by_identifier(identifier)

        if not colis:
            # If colis not found, try to create it with the identifier as FedEx ID
            try:
                colis_data = ColisCreate(
                    id=identifier,
                    description=f"Package with FedEx ID {identifier}"
                )
                colis = colis_service.create_colis(colis_data)
                if not colis:
                    return TrackingResponse(
                        success=False,
                        data=None,
                        error=f"Failed to create package with identifier {identifier}",
                        metadata={
                            "timestamp": datetime.now().isoformat(),
                            "identifier": identifier
                        }
                    )
            except Exception as e:
                logger.error(f"Error creating package: {str(e)}")
                return TrackingResponse(
                    success=False,
                    data=None,
                    error=f"Colis with identifier {identifier} not found and could not be created",
                    metadata={
                        "timestamp": datetime.now().isoformat(),
                        "identifier": identifier
                    }
                )

        # Use the real FedEx ID from the found colis to track via FedExService
        fedex_id = colis.id

        # Track via FedEx
        response = await fedex_service.track_package(fedex_id)

        # Add metadata about the identifier used
        if response.metadata:
            response.metadata["identifier"] = identifier
            response.metadata["identifier_type"] = "fedex_id"
            response.metadata["reference"] = colis.reference
            response.metadata["tcn"] = colis.tcn
            response.metadata["code_barre"] = colis.code_barre
        else:
            response.metadata = {
                "timestamp": datetime.now().isoformat(),
                "identifier": identifier,
                "identifier_type": "fedex_id",
                "reference": colis.reference,
                "tcn": colis.tcn,
                "code_barre": colis.code_barre
            }

        if request:
            try:
                user = await get_current_user(request, db, token)
                TrackingHistoryService(db).log_search(user.id, identifier)
            except Exception:
                pass

        return response

    except Exception as e:
        logger.error(f"Error tracking package {identifier}: {str(e)}")
        return TrackingResponse(
            success=False,
            data=None,
            error=str(e),
            metadata={
                "timestamp": datetime.now().isoformat(),
                "identifier": identifier
            }
        )

@router.post("/batch", response_model=List[TrackingResponse])
async def track_multiple_packages(
    tracking_numbers: List[str],
    db: Session = Depends(get_db)
):
    """
    Track multiple packages (max 40)
    """
    tracking_service = TrackingService(db=db)
    response = tracking_service.track_multiple_packages(tracking_numbers)
    if not response:
        raise HTTPException(status_code=400, detail="Failed to track packages")
    return response


@router.post("/email", response_model=TrackingResponse)
async def track_by_email(
    request: TrackByEmailRequest,
    db: Session = Depends(get_db),
):
    """Track a package and send the result via email."""
    fedex_service = FedExService()
    response = await fedex_service.track_package(request.tracking_number)
    if response.success:
        status = response.data.status if response.data else ""
        try:
            from ....services.email import send_tracking_update_email
            send_tracking_update_email(request.email, request.tracking_number, status)
        except Exception as e:
            logger.error(f"Failed to send tracking email: {str(e)}")
    return response

@router.post("/search", response_model=Dict[str, Any])
async def search_trackings(
    filters: TrackingFilter,
    db: Session = Depends(get_db)
):
    """
    Search and filter tracking records
    """
    tracking_service = TrackingService(db=db)
    try:
        results, total_count = tracking_service.search_trackings(filters)
        return {
            "success": True,
            "data": results,
            "total": total_count,
            "page": filters.page,
            "page_size": filters.page_size,
            "total_pages": (total_count + filters.page_size - 1) // filters.page_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=Dict[str, Any])
async def get_tracking_stats(
    db: Session = Depends(get_db)
):
    """
    Get tracking statistics
    """
    tracking_service = TrackingService(db=db)
    try:
        stats = tracking_service.get_tracking_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/number/{tracking_number}", response_model=TrackingResponse)
async def track_by_number(tracking_number: str, db: Session = Depends(get_db)):
    """Track a package using its tracking number."""
    return await track_package(tracking_number, db)


@router.get("/reference/{reference}", response_model=TrackingResponse)
async def track_by_reference(reference: str, db: Session = Depends(get_db)):
    """Track a package using its reference."""
    colis_service = ColisService(db)
    colis = colis_service.get_colis_by_reference(reference)
    if not colis:
        raise HTTPException(status_code=404, detail="Colis not found")
    return await track_package(colis.id, db)


@router.get("/tcn/{tcn}", response_model=TrackingResponse)
async def track_by_tcn(tcn: str, db: Session = Depends(get_db)):
    """Track a package using its TCN."""
    colis_service = ColisService(db)
    colis = colis_service.get_colis_by_tcn(tcn)
    if not colis:
        raise HTTPException(status_code=404, detail="Colis not found")
    return await track_package(colis.id, db)


@router.get("/{identifier}/export")
async def export_tracking_events(
    identifier: str,
    format: str = "csv",
    db: Session = Depends(get_db)
):
    """Export tracking events for a package in CSV or PDF format."""
    colis_service = ColisService(db)
    colis = colis_service.get_colis_by_identifier(identifier)
    if not colis:
        raise HTTPException(status_code=404, detail="Colis not found")
    events = colis.tracking_events

    if format.lower() == "pdf":
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        y = 750
        pdf.drawString(50, y, f"Tracking events for {identifier}")
        y -= 20
        for evt in events:
            loc = evt.location
            loc_str = ""
            if loc:
                loc_str = f"{loc.city or ''} {loc.state or ''} {loc.country or ''}"
            pdf.drawString(50, y, f"{evt.timestamp} - {evt.status} - {loc_str}")
            y -= 15
            if y < 50:
                pdf.showPage()
                y = 750
        pdf.save()
        buffer.seek(0)
        headers = {"Content-Disposition": f"attachment; filename={identifier}.pdf"}
        return StreamingResponse(buffer, media_type="application/pdf", headers=headers)

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["timestamp", "status", "description", "city", "state", "country", "postal_code"])
    for evt in events:
        loc = evt.location
        writer.writerow([
            evt.timestamp,
            evt.status,
            evt.description,
            getattr(loc, "city", ""),
            getattr(loc, "state", ""),
            getattr(loc, "country", ""),
            getattr(loc, "postal_code", ""),
        ])
    out.seek(0)
    headers = {"Content-Disposition": f"attachment; filename={identifier}.csv"}
    return StreamingResponse(io.BytesIO(out.getvalue().encode()), media_type="text/csv", headers=headers)


@router.post("/barcode/decode")
async def decode_barcode(file: UploadFile = File(...)):
    """Decode a barcode image and return the embedded number."""
    content = await file.read()
    img = Image.open(io.BytesIO(content))
    try:
        from pyzbar.pyzbar import decode as decode_bar
    except Exception as exc:
        raise HTTPException(status_code=500, detail="pyzbar not available") from exc

    decoded = decode_bar(img)
    if not decoded:
        raise HTTPException(status_code=400, detail="Unable to decode barcode")
    return {"barcode": decoded[0].data.decode("utf-8")}


@router.get("/proof/{identifier}")
async def get_proof_of_delivery(identifier: str, db: Session = Depends(get_db)):
    """Return the proof-of-delivery PDF for a package."""
    colis_service = ColisService(db)
    fedex_service = FedExService()

    colis = await colis_service.get_colis_by_identifier(identifier)
    tracking_number = colis.id if colis else identifier

    try:
        pdf_bytes = await fedex_service.get_proof_of_delivery(tracking_number)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Proof of delivery not found")
    except httpx.HTTPStatusError as e:
        logger.error(f"FedEx error for {identifier}: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="FedEx service error")
    except Exception as e:
        logger.error(f"Error fetching proof of delivery for {identifier}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch proof of delivery")

    headers = {"Content-Disposition": f"attachment; filename=proof_{tracking_number}.pdf"}
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers)
