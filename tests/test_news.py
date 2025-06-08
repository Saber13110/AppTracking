import os
import sys
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

# Set required env vars before importing the app modules
os.environ.setdefault('DATABASE_URL', 'sqlite:///:memory:')
os.environ.setdefault('FEDEX_CLIENT_ID', 'dummy')
os.environ.setdefault('FEDEX_CLIENT_SECRET', 'dummy')
os.environ.setdefault('FEDEX_ACCOUNT_NUMBER', 'dummy')
os.environ.setdefault('SECRET_KEY', 'testsecret')

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database import get_db
from backend.app.api.v1.endpoints import news as news_router
from backend.app.services.news_service import NewsArticleService
from backend.app.models.news import NewsArticleCreate


@pytest.fixture
def db_session(monkeypatch):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from backend.app.database import Base as AppBase

    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    monkeypatch.setattr("backend.app.database.engine", test_engine, raising=False)
    monkeypatch.setattr("backend.app.database.SessionLocal", TestingSessionLocal, raising=False)

    AppBase.metadata.drop_all(bind=test_engine)
    AppBase.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def news_client(db_session):
    app = FastAPI()
    app.include_router(news_router.router, prefix='/news')

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


def test_list_news_returns_articles(news_client, db_session):
    service = NewsArticleService(db_session)
    service.create_article(
        NewsArticleCreate(title='Hello', slug='hello', content='World')
    )
    resp = news_client.get('/news/')
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]['slug'] == 'hello'


def test_get_article_by_slug(news_client, db_session):
    service = NewsArticleService(db_session)
    service.create_article(
        NewsArticleCreate(title='Title', slug='slugged', content='Body')
    )
    resp = news_client.get('/news/slugged')
    assert resp.status_code == 200
    assert resp.json()['slug'] == 'slugged'


def test_get_article_not_found(news_client):
    resp = news_client.get('/news/unknown')
    assert resp.status_code == 404
