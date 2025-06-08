import logging
from datetime import datetime
from typing import List, Optional
from uuid import uuid4
from sqlalchemy.orm import Session
from .email import send_tracking_update_email, send_sms
from ..models.notification import (
    Notification,
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
    NotificationType,
    NotificationPreference,
    NotificationPreferenceResponse,
)
from ..models.database import NotificationDB
from ..models.notification_preference import NotificationPreferenceDB

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(self, notification_data: NotificationCreate) -> NotificationResponse:
        """
        Create a new notification
        """
        try:
            notification_id = str(uuid4())
            data = notification_data.dict()
            # Rename metadata to meta_data
            if 'metadata' in data:
                data['meta_data'] = data.pop('metadata')
            
            db_notification = NotificationDB(
                id=notification_id,
                **data
            )
            
            self.db.add(db_notification)
            self.db.commit()
            self.db.refresh(db_notification)

            # Send alerts based on user preferences
            self._send_alerts(db_notification)
            
            # Convert meta_data back to metadata for the response
            notification_dict = {
                **db_notification.__dict__,
                'metadata': db_notification.meta_data
            }
            notification_dict.pop('meta_data', None)
            notification = Notification(**notification_dict)
            
            logger.info(f"Created notification: {notification_id}")
            
            return NotificationResponse(
                success=True,
                data=notification,
                metadata={
                    'timestamp': datetime.now().isoformat(),
                    'notification_id': notification_id
                }
            )
        except Exception as e:
            self.db.rollback()
            error_msg = f"Failed to create notification: {str(e)}"
            logger.error(error_msg)
            return NotificationResponse(
                success=False,
                error=error_msg,
                metadata={'timestamp': datetime.now().isoformat()}
            )

    def get_notification(self, notification_id: str) -> NotificationResponse:
        """
        Get a notification by ID
        """
        try:
            db_notification = self.db.query(NotificationDB).filter(NotificationDB.id == notification_id).first()
            if not db_notification:
                return NotificationResponse(
                    success=False,
                    error=f"Notification not found: {notification_id}",
                    metadata={'timestamp': datetime.now().isoformat()}
                )
            
            # Convert meta_data back to metadata for the response
            notification_dict = {
                **db_notification.__dict__,
                'metadata': db_notification.meta_data
            }
            notification_dict.pop('meta_data', None)
            notification = Notification(**notification_dict)
            
            return NotificationResponse(
                success=True,
                data=notification,
                metadata={'timestamp': datetime.now().isoformat()}
            )
        except Exception as e:
            error_msg = f"Failed to get notification: {str(e)}"
            logger.error(error_msg)
            return NotificationResponse(
                success=False,
                error=error_msg,
                metadata={'timestamp': datetime.now().isoformat()}
            )

    def get_all_notifications(
        self,
        skip: int = 0,
        limit: int = 100,
        unread_only: bool = False,
        notification_type: Optional[NotificationType] = None
    ) -> List[Notification]:
        """
        Get all notifications with optional filtering
        """
        try:
            query = self.db.query(NotificationDB)
            
            if unread_only:
                query = query.filter(NotificationDB.is_read.is_(False))
            if notification_type:
                query = query.filter(NotificationDB.type == notification_type)
            
            db_notifications = query.order_by(NotificationDB.created_at.desc()).offset(skip).limit(limit).all()
            
            # Convert meta_data back to metadata for each notification
            notifications = []
            for db_notification in db_notifications:
                notification_dict = {
                    **db_notification.__dict__,
                    'metadata': db_notification.meta_data
                }
                notification_dict.pop('meta_data', None)
                notifications.append(Notification(**notification_dict))
            
            return notifications
        except Exception as e:
            logger.error(f"Failed to get notifications: {str(e)}")
            return []

    def update_notification(
        self,
        notification_id: str,
        update_data: NotificationUpdate
    ) -> NotificationResponse:
        """
        Update a notification
        """
        try:
            db_notification = self.db.query(NotificationDB).filter(NotificationDB.id == notification_id).first()
            if not db_notification:
                return NotificationResponse(
                    success=False,
                    error=f"Notification not found: {notification_id}",
                    metadata={'timestamp': datetime.now().isoformat()}
                )
            
            # Update notification fields
            update_dict = update_data.dict(exclude_unset=True)
            if 'metadata' in update_dict:
                update_dict['meta_data'] = update_dict.pop('metadata')
            
            for key, value in update_dict.items():
                setattr(db_notification, key, value)
            
            # Update read_at timestamp if marking as read
            if update_data.is_read and not db_notification.read_at:
                db_notification.read_at = datetime.now()
            
            self.db.commit()
            self.db.refresh(db_notification)
            
            # Convert meta_data back to metadata for the response
            notification_dict = {
                **db_notification.__dict__,
                'metadata': db_notification.meta_data
            }
            notification_dict.pop('meta_data', None)
            notification = Notification(**notification_dict)
            
            logger.info(f"Updated notification: {notification_id}")
            
            return NotificationResponse(
                success=True,
                data=notification,
                metadata={'timestamp': datetime.now().isoformat()}
            )
        except Exception as e:
            self.db.rollback()
            error_msg = f"Failed to update notification: {str(e)}"
            logger.error(error_msg)
            return NotificationResponse(
                success=False,
                error=error_msg,
                metadata={'timestamp': datetime.now().isoformat()}
            )

    def delete_notification(self, notification_id: str) -> NotificationResponse:
        """
        Delete a notification
        """
        try:
            db_notification = self.db.query(NotificationDB).filter(NotificationDB.id == notification_id).first()
            if not db_notification:
                return NotificationResponse(
                    success=False,
                    error=f"Notification not found: {notification_id}",
                    metadata={'timestamp': datetime.now().isoformat()}
                )
            
            self.db.delete(db_notification)
            self.db.commit()
            
            logger.info(f"Deleted notification: {notification_id}")
            return NotificationResponse(
                success=True,
                metadata={'timestamp': datetime.now().isoformat()}
            )
        except Exception as e:
            self.db.rollback()
            error_msg = f"Failed to delete notification: {str(e)}"
            logger.error(error_msg)
            return NotificationResponse(
                success=False,
                error=error_msg,
                metadata={'timestamp': datetime.now().isoformat()}
            )

    def mark_all_as_read(self) -> NotificationResponse:
        """
        Mark all notifications as read
        """
        try:
            now = datetime.now()
            self.db.query(NotificationDB).filter(
                NotificationDB.is_read.is_(False)
            ).update({
                "is_read": True,
                "read_at": now
            })
            self.db.commit()
            
            logger.info("Marked all notifications as read")
            return NotificationResponse(
                success=True,
                metadata={
                    'timestamp': now.isoformat(),
                    'notifications_updated': self.db.query(NotificationDB).count()
                }
            )
        except Exception as e:
            self.db.rollback()
            error_msg = f"Failed to mark all notifications as read: {str(e)}"
            logger.error(error_msg)
            return NotificationResponse(
                success=False,
                error=error_msg,
                metadata={'timestamp': datetime.now().isoformat()}
            )

    def get_preferences(self, user_id: int) -> NotificationPreferenceResponse:
        """Return notification preferences for a user, creating defaults if needed."""
        try:
            pref = (
                self.db.query(NotificationPreferenceDB)
                .filter(NotificationPreferenceDB.user_id == user_id)
                .first()
            )
            if not pref:
                pref = NotificationPreferenceDB(user_id=user_id, email_updates=True)
                self.db.add(pref)
                self.db.commit()
                self.db.refresh(pref)
            return NotificationPreferenceResponse(
                success=True,
                data=NotificationPreference(
                    email_updates=pref.email_updates,
                    addresses=pref.addresses or [],
                    preferred_language=pref.preferred_language,
                    event_settings=pref.event_settings or {},
                ),
            )
        except Exception as e:
            self.db.rollback()
            return NotificationPreferenceResponse(success=False, error=str(e))

    def _send_alerts(self, notification: NotificationDB) -> None:
        """Send email/SMS alerts according to user preferences."""
        try:
            prefs = self.db.query(NotificationPreferenceDB).all()
            for pref in prefs:
                channels = (pref.event_settings or {}).get(notification.type.value, [])
                if not channels:
                    continue
                addresses = pref.addresses or []
                for addr in addresses[:5]:
                    if 'email' in channels and '@' in addr:
                        send_tracking_update_email(
                            addr,
                            notification.tracking_number or '',
                            notification.message,
                        )
                    if 'sms' in channels and '@' not in addr:
                        send_sms(addr, notification.message)
        except Exception:
            logger.error("Failed sending alert for notification %s", notification.id)

    def update_preferences(
        self,
        user_id: int,
        preferences: NotificationPreference,
    ) -> NotificationPreferenceResponse:
        """Update notification preferences for a user."""
        try:
            pref = (
                self.db.query(NotificationPreferenceDB)
                .filter(NotificationPreferenceDB.user_id == user_id)
                .first()
            )
            if not pref:
                pref = NotificationPreferenceDB(user_id=user_id)
                self.db.add(pref)

            pref.email_updates = preferences.email_updates
            pref.addresses = preferences.addresses[:5]
            pref.preferred_language = preferences.preferred_language
            pref.event_settings = preferences.event_settings

            self.db.commit()
            self.db.refresh(pref)
            return NotificationPreferenceResponse(
                success=True,
                data=NotificationPreference(
                    email_updates=pref.email_updates,
                    addresses=pref.addresses or [],
                    preferred_language=pref.preferred_language,
                    event_settings=pref.event_settings or {},
                ),
            )
        except Exception as e:
            self.db.rollback()
            return NotificationPreferenceResponse(success=False, error=str(e))
