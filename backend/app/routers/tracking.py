from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

# Corrected absolute imports
from app.models.tracking import (
    TrackingResponse
)
from app.database import get_db
from app.services.colis_service import ColisService
from app.services.fedex_service import FedExService

router = APIRouter()
logger = logging.getLogger(__name__)

class TrackingRequest(BaseModel):
    tracking_number: str
    customer_name: Optional[str] = None
    note: Optional[str] = None

class BatchTrackingRequest(BaseModel):
    tracking_numbers: List[str]

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
            return TrackingResponse(
                success=False,
                data=None,
                error=f"Colis with identifier {identifier} not found",
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
        else:
            response.metadata = {
                "timestamp": datetime.now().isoformat(),
                "identifier": identifier,
                "identifier_type": "fedex_id"
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

# The batch tracking, search, and stats endpoints are commented out
# as they relied on the old TrackingService structure.
# @router.post("/track", response_model=TrackingResponse)
# async def track_package(
#     request: TrackingRequest,
#     db: Session = Depends(get_db)
# ):
#     pass

# @router.post("/track/batch", response_model=List[TrackingResponse])
# async def track_multiple_packages(
#     request: BatchTrackingRequest,
#     db: Session = Depends(get_db)
# ):
#     pass

# @router.put("/track/{tracking_id}", response_model=TrackingResponse)
# async def update_tracking(
#     tracking_id: str,
#     request: TrackingRequest,
#     db: Session = Depends(get_db)
# ):
#     pass

# @router.get("/track/results")
# async def get_tracking_results(
#     start_date: Optional[str] = None,
#     end_date: Optional[str] = None,
#     courier_code: Optional[str] = None
# ):
#     try:
#         pass
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=str(e))