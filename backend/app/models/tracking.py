from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PackageStatus(str, Enum):
    PENDING = "PENDING"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    EXCEPTION = "EXCEPTION"
    UNKNOWN = "UNKNOWN"

class PackageType(str, Enum):
    GROUND = "GROUND"
    EXPRESS = "EXPRESS"
    FIRST_OVERNIGHT = "FIRST_OVERNIGHT"
    PRIORITY_OVERNIGHT = "PRIORITY_OVERNIGHT"
    STANDARD_OVERNIGHT = "STANDARD_OVERNIGHT"
    INTERNATIONAL = "INTERNATIONAL"
    UNKNOWN = "UNKNOWN"

class ServiceType(str, Enum):
    GROUND = "GROUND"
    EXPRESS = "EXPRESS"
    FIRST_OVERNIGHT = "FIRST_OVERNIGHT"
    PRIORITY_OVERNIGHT = "PRIORITY_OVERNIGHT"
    STANDARD_OVERNIGHT = "STANDARD_OVERNIGHT"
    INTERNATIONAL = "INTERNATIONAL"
    HOME_DELIVERY = "HOME_DELIVERY"
    GROUND_ECONOMY = "GROUND_ECONOMY"
    CUSTOM_CRITICAL = "CUSTOM_CRITICAL"
    FREIGHT = "FREIGHT"
    SMART_POST = "SMART_POST"
    UNKNOWN = "UNKNOWN"

class Coordinates(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Location(BaseModel):
    city: str
    state: str
    country: str
    postal_code: Optional[str] = None
    coordinates: Optional[Coordinates] = None

class TrackingEvent(BaseModel):
    status: str
    description: str
    timestamp: Optional[str] = None
    location: Optional[Location] = None
    event_type: Optional[str] = None
    event_code: Optional[str] = None
    exception_code: Optional[str] = None
    exception_description: Optional[str] = None

class PackageDetails(BaseModel):
    weight: Optional[Dict[str, Any]] = None
    dimensions: Optional[Dict[str, Any]] = None
    service_type: Optional[str] = None
    signature_required: Optional[bool] = None
    special_handling: Optional[List[str]] = None
    declared_value: Optional[float] = None
    customs_value: Optional[float] = None
    package_count: Optional[int] = None
    packaging_description: Optional[str] = None

class DeliveryDetails(BaseModel):
    delivery_date: Optional[str] = None
    delivery_time: Optional[str] = None
    delivery_location: Optional[Location] = None
    delivery_instructions: Optional[str] = None
    delivery_attempts: Optional[int] = None
    delivery_exceptions: Optional[List[str]] = None
    actual_delivery: Optional[str] = None
    estimated_delivery: Optional[str] = None
    received_by_name: Optional[str] = None
    delivery_option_eligibility: Optional[Dict[str, bool]] = None

class KeyDates(BaseModel):
    actual_delivery: Optional[str] = None
    actual_pickup: Optional[str] = None
    ship: Optional[str] = None
    actual_tender: Optional[str] = None
    anticipated_tender: Optional[str] = None

class CommercialInfo(BaseModel):
    tracking_number_unique_id: Optional[str] = None
    package_identifiers: Optional[List[Dict[str, str]]] = None
    service_detail: Optional[str] = None
    available_notifications: Optional[List[str]] = None

class TrackingInfo(BaseModel):
    tracking_number: str
    status: str
    carrier: str
    service_type: ServiceType = ServiceType.UNKNOWN
    origin: Location
    destination: Location
    package_details: PackageDetails
    delivery_details: DeliveryDetails
    events: List[TrackingEvent]
    key_dates: KeyDates
    commercial_info: CommercialInfo
    tracking_url: Optional[str] = None

class TrackingResponse(BaseModel):
    success: bool
    data: Optional[TrackingInfo] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class TrackingFilter(BaseModel):
    tracking_number: Optional[str] = None
    status: Optional[PackageStatus] = None
    carrier: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[Location] = None
    service_type: Optional[PackageType] = None
    is_delivered: Optional[bool] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = "desc"
    page: Optional[int] = 1
    page_size: Optional[int] = 10 