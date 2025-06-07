import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from uuid import uuid4
from .fedex_service import FedExService
from ..models.tracking import (
    TrackingInfo, TrackingEvent, TrackingResponse, Location,
    PackageDetails, DeliveryDetails, TrackingFilter
)
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, and_
from ..models.database import TrackingDB, TrackingEventDB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrackingService:
    def __init__(self, db: Session):
        self.db = db
        self.fedex_service = FedExService()

    def _validate_tracking_number(self, tracking_number: str) -> bool:
        """
        Validate tracking number format
        """
        # FedEx tracking numbers are typically 12 digits
        if not tracking_number or not tracking_number.isdigit() or len(tracking_number) != 12:
            return False
        return True

    async def track_single_package(
        self,
        tracking_number: str
    ) -> TrackingResponse:
        """
        Track a single package using FedEx API (simplified)
        """
        try:
            logger.info(f"Tracking package: {tracking_number}")
            
            # Validate tracking number
            if not self._validate_tracking_number(tracking_number):
                return TrackingResponse(
                    success=False,
                    data=None,
                    error="Invalid tracking number format. FedEx tracking numbers must be 12 digits.",
                    metadata={
                        'timestamp': datetime.now().isoformat(),
                        'tracking_number': tracking_number
                    }
                )

            # Track package with FedEx
            result = await self.fedex_service.track_package(tracking_number)
            
            if not result.success:
                logger.error(f"Failed to track package {tracking_number}: {result.error}")
                # Return the error response from FedEx tracking
                return result

            # Return the successful response from FedEx tracking
            return result

        except Exception as e:
            # Catch unexpected errors during the process
            error_msg = f"Unexpected error tracking package {tracking_number}: {str(e)}"
            logger.error(error_msg)
            return TrackingResponse(
                success=False,
                data=None,
                error=error_msg,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'tracking_number': tracking_number
                }
            )

    async def track_multiple_packages(self, tracking_numbers: List[str]) -> List[TrackingResponse]:
        """
        Track multiple packages using FedEx API (simplified)
        """
        responses = []
        for tracking_number in tracking_numbers:
            response = await self.track_single_package(tracking_number)
            responses.append(response)
        return responses

    async def update_tracking(self, tracking_id: str, 
                            customer_name: Optional[str] = None,
                            note: Optional[str] = None) -> TrackingResponse:
        """
        Update tracking information
        """
        try:
            logger.info(f"Updating tracking info for package {tracking_id}")
            
            # Validate tracking number
            if not self._validate_tracking_number(tracking_id):
                return TrackingResponse(
                    success=False,
                    data=None,
                    error="Invalid tracking number format. FedEx tracking numbers must be 12 digits.",
                    metadata={
                        'timestamp': datetime.now().isoformat(),
                        'tracking_number': tracking_id
                    }
                )

            # Note: FedEx API doesn't support updating tracking information
            # This is a placeholder for future implementation
            return TrackingResponse(
                success=False,
                data=None,
                error="Updating tracking information is not supported by FedEx API",
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'tracking_number': tracking_id
                }
            )

        except Exception as e:
            error_msg = f"Unexpected error updating tracking info: {str(e)}"
            logger.error(error_msg)
            return TrackingResponse(
                success=False,
                data=None,
                error=error_msg,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'tracking_number': tracking_id
                }
            )

    async def search_trackings(self, filters: TrackingFilter) -> Tuple[List[TrackingInfo], int]:
        """
        Search and filter tracking records
        """
        try:
            # Build base query
            query = self.db.query(TrackingDB)

            # Apply filters
            if filters.tracking_number:
                query = query.filter(TrackingDB.tracking_number.ilike(f"%{filters.tracking_number}%"))

            if filters.status:
                query = query.filter(TrackingDB.status == filters.status)

            if filters.carrier:
                query = query.filter(TrackingDB.carrier == filters.carrier)

            if filters.customer_name:
                query = query.filter(TrackingDB.meta_data['customer_name'].astext.ilike(f"%{filters.customer_name}%"))

            if filters.start_date:
                query = query.filter(TrackingDB.created_at >= filters.start_date)

            if filters.end_date:
                query = query.filter(TrackingDB.created_at <= filters.end_date)

            if filters.location:
                location_filters = []
                if filters.location.city:
                    location_filters.append(TrackingEventDB.location.has(city=filters.location.city))
                if filters.location.state:
                    location_filters.append(TrackingEventDB.location.has(state=filters.location.state))
                if filters.location.country:
                    location_filters.append(TrackingEventDB.location.has(country=filters.location.country))
                if filters.location.postal_code:
                    location_filters.append(TrackingEventDB.location.has(postal_code=filters.location.postal_code))
                if location_filters:
                    query = query.filter(TrackingDB.events.any(and_(*location_filters)))

            if filters.service_type:
                query = query.filter(TrackingDB.package_details.has(service_type=filters.service_type))

            if filters.is_delivered is not None:
                if filters.is_delivered:
                    query = query.filter(TrackingDB.status == "DELIVERED")
                else:
                    query = query.filter(TrackingDB.status != "DELIVERED")

            # Get total count before pagination
            total_count = query.count()

            # Apply sorting
            if filters.sort_by:
                sort_column = getattr(TrackingDB, filters.sort_by, None)
                if sort_column is not None:
                    if filters.sort_order == "desc":
                        query = query.order_by(desc(sort_column))
                    else:
                        query = query.order_by(asc(sort_column))

            # Apply pagination
            query = query.offset((filters.page - 1) * filters.page_size).limit(filters.page_size)

            # Execute query and convert results
            results = []
            for db_tracking in query.all():
                results.append(self._convert_db_to_tracking_info(db_tracking))

            return results, total_count

        except Exception as e:
            logger.error(f"Error searching trackings: {str(e)}")
            raise

    async def get_tracking_stats(self) -> Dict[str, Any]:
        """
        Get tracking statistics
        """
        try:
            total_trackings = self.db.query(TrackingDB).count()
            delivered_trackings = self.db.query(TrackingDB).filter(TrackingDB.status == "DELIVERED").count()
            in_transit_trackings = self.db.query(TrackingDB).filter(TrackingDB.status == "IN_TRANSIT").count()
            exception_trackings = self.db.query(TrackingDB).filter(TrackingDB.status == "EXCEPTION").count()

            # Get status distribution
            status_counts = {}
            for status in self.db.query(TrackingDB.status).distinct():
                count = self.db.query(TrackingDB).filter(TrackingDB.status == status[0]).count()
                status_counts[status[0]] = count

            # Get carrier distribution
            carrier_counts = {}
            for carrier in self.db.query(TrackingDB.carrier).distinct():
                count = self.db.query(TrackingDB).filter(TrackingDB.carrier == carrier[0]).count()
                carrier_counts[carrier[0]] = count

            return {
                "total_trackings": total_trackings,
                "delivered_trackings": delivered_trackings,
                "in_transit_trackings": in_transit_trackings,
                "exception_trackings": exception_trackings,
                "status_distribution": status_counts,
                "carrier_distribution": carrier_counts,
                "delivery_rate": (delivered_trackings / total_trackings * 100) if total_trackings > 0 else 0
            }

        except Exception as e:
            logger.error(f"Error getting tracking stats: {str(e)}")
            raise 