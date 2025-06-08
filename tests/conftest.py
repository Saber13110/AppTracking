import os
import sys
import pytest

# Ensure required environment variables for backend configuration
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')

# Allow tests to import backend modules when executed directly
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database import Base, engine, SessionLocal
try:
    from backend.app.models.database import Base as ModelsBase
except Exception:  # pragma: no cover - optional models package
    ModelsBase = None


@pytest.fixture
def db_session():
    """Provide a fresh in-memory database session for each test."""
    Base.metadata.drop_all(bind=engine)
    if ModelsBase is not None:
        ModelsBase.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    if ModelsBase is not None:
        ModelsBase.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
