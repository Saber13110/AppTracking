import os
import sys
import asyncio
import pytest
from fastapi import HTTPException

# Set required env vars before importing the app modules
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database import Base, engine, SessionLocal
from backend.app.models.database import Base as ModelsBase, NotificationDB
from backend.app.api.v1.endpoints import notifications as notifications_router
from backend.app.models.notification import NotificationCreate, NotificationUpdate, NotificationType
from backend.app.models.user import UserCreate, UserRole
from backend.app.services import auth


@pytest.fixture
def db_session():
    Base.metadata.drop_all(bind=engine)
    ModelsBase.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    ModelsBase.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_user_with_role(db, role: UserRole):
    user = auth.create_user(db, UserCreate(email=f"{role}@example.com", full_name="U", password="Password1"))
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def test_create_and_mark_notification(db_session):
    admin = create_user_with_role(db_session, UserRole.admin)
    create = NotificationCreate(
        type=NotificationType.CUSTOM,
        title="hello",
        message="msg"
    )
    resp = asyncio.run(notifications_router.create_notification(create, db_session, admin))
    assert resp.success is True
    notif_id = resp.data.id

    update = NotificationUpdate(is_read=True)
    updated = asyncio.run(notifications_router.update_notification(notif_id, update, db_session, admin))
    assert updated.success is True
    assert updated.data.is_read is True
    assert updated.data.read_at is not None


def test_mark_all_as_read(db_session):
    admin = create_user_with_role(db_session, UserRole.admin)
    create = NotificationCreate(type=NotificationType.CUSTOM, title="one", message="1")
    resp1 = asyncio.run(notifications_router.create_notification(create, db_session, admin))
    resp2 = asyncio.run(notifications_router.create_notification(create, db_session, admin))
    assert resp1.success and resp2.success

    res = asyncio.run(notifications_router.mark_all_as_read(db_session, admin))
    assert res.success is True

    all_notifs = asyncio.run(notifications_router.get_notifications(db=db_session))
    assert all(n.is_read for n in all_notifs)


def test_create_notification_forbidden(db_session):
    user = create_user_with_role(db_session, UserRole.client)
    create = NotificationCreate(type=NotificationType.CUSTOM, title="bad", message="x")
    check = auth.require_role(UserRole.admin)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(check(current_user=user))
    assert exc.value.status_code == 403
