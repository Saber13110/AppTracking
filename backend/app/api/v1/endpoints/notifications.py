from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from ....models.notification import (
    Notification,
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
    NotificationType,
    NotificationPreference,
    NotificationPreferenceResponse,
)
from ....services.notification_service import NotificationService
from ....database import get_db
from ....services.auth import require_role, get_current_active_user
from ....models.user import UserDB, UserRole

router = APIRouter()


@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(UserRole.admin)),
):
    """
    Create a new notification
    """
    notification_service = NotificationService(db)
    response = notification_service.create_notification(notification)
    if not response.success:
        raise HTTPException(status_code=400, detail=response.error)
    return response


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: str, db: Session = Depends(get_db)
):
    """
    Get a notification by ID
    """
    notification_service = NotificationService(db)
    response = notification_service.get_notification(notification_id)
    if not response.success:
        raise HTTPException(status_code=404, detail=response.error)
    return response


@router.get("/", response_model=List[Notification])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    unread_only: bool = False,
    notification_type: Optional[NotificationType] = None,
    db: Session = Depends(get_db),
):
    """
    Get all notifications with optional filtering
    """
    notification_service = NotificationService(db)
    return notification_service.get_all_notifications(
        skip=skip,
        limit=limit,
        unread_only=unread_only,
        notification_type=notification_type,
    )


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: str,
    update_data: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(UserRole.admin)),
):
    """
    Update a notification
    """
    notification_service = NotificationService(db)
    response = notification_service.update_notification(
        notification_id, update_data
    )
    if not response.success:
        raise HTTPException(status_code=404, detail=response.error)
    return response


@router.delete("/{notification_id}", response_model=NotificationResponse)
async def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(UserRole.admin)),
):
    """
    Delete a notification
    """
    notification_service = NotificationService(db)
    response = notification_service.delete_notification(notification_id)
    if not response.success:
        raise HTTPException(status_code=404, detail=response.error)
    return response


@router.post("/mark-all-read", response_model=NotificationResponse)
async def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(UserRole.admin)),
):
    """
    Mark all notifications as read
    """
    notification_service = NotificationService(db)
    return notification_service.mark_all_as_read()


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_preferences(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
):
    service = NotificationService(db)
    return service.get_preferences(current_user.id)


@router.post("/preferences", response_model=NotificationPreferenceResponse)
async def update_preferences(
    prefs: NotificationPreference,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_active_user),
):
    service = NotificationService(db)
    return service.update_preferences(current_user.id, prefs)
