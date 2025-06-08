from fastapi import APIRouter, HTTPException, Depends
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
from datetime import datetime
import logging
from ....models.colis import ColisCreate

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
    db: Session = Depends(get_db)
):
    """
    Create a new package with the given FedEx ID
    """
    try:
        colis_service = ColisService(db)
        
        # Create the colis
        colis = await colis_service.create_colis(colis_data)
        
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
    db: Session = Depends(get_db)
):
    """
    Track a single package by any identifier (FedEx ID, reference, TCN, or barcode)
    """
    try:
        colis_service = ColisService(db)
        fedex_service = FedExService()

        # Try to find the colis using any identifier type
        colis = await colis_service.get_colis_by_identifier(identifier)

        if not colis:
            # If colis not found, try to create it with the identifier as FedEx ID
            try:
                colis_data = ColisCreate(
                    id=identifier,
                    description=f"Package with FedEx ID {identifier}"
                )
                colis = await colis_service.create_colis(colis_data)
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
    response = await tracking_service.track_multiple_packages(tracking_numbers)
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
        results, total_count = await tracking_service.search_trackings(filters)
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
        stats = await tracking_service.get_tracking_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 
