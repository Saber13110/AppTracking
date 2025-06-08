from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class NotificationType(str, Enum):
    TRACKING_UPDATE = "tracking_update"
    DELIVERY_STATUS = "delivery_status"
    SYSTEM_ALERT = "system_alert"
    CUSTOM = "custom"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Notification(BaseModel):
    id: str = Field(..., description="Unique identifier for the notification")
    type: NotificationType = Field(..., description="Type of notification")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message")
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM, description="Notification priority")
    tracking_number: Optional[str] = Field(None, description="Associated tracking number if applicable")
    is_read: bool = Field(default=False, description="Whether the notification has been read")
    created_at: datetime = Field(default_factory=datetime.now, description="When the notification was created")
    read_at: Optional[datetime] = Field(None, description="When the notification was read")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")

class NotificationCreate(BaseModel):
    type: NotificationType
    title: str
    message: str
    priority: NotificationPriority = NotificationPriority.MEDIUM
    tracking_number: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class NotificationResponse(BaseModel):
    success: bool
    data: Optional[Notification] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict) 
