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

# Import all model modules so SQLAlchemy tables are registered even when only a
# single test is executed. This guarantees ``Base.metadata`` is aware of every
# table before ``create_all`` is invoked.
import importlib
import pkgutil



@pytest.fixture
def db_session():
    """Provide a fresh in-memory database session for each test."""
    import backend.app.models as models_pkg
    for _, name, _ in pkgutil.iter_modules(models_pkg.__path__):
        importlib.import_module(f"{models_pkg.__name__}.{name}")

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
