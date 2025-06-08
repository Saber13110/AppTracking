from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....database import get_db
from ....services.news_service import NewsArticleService
from ....models.news import NewsArticle

router = APIRouter()


@router.get("/", response_model=list[NewsArticle])
def list_articles(db: Session = Depends(get_db), skip: int = 0, limit: int = 10):
    service = NewsArticleService(db)
    return service.get_articles(skip=skip, limit=limit)


@router.get("/{slug}", response_model=NewsArticle)
def get_article(slug: str, db: Session = Depends(get_db)):
    service = NewsArticleService(db)
    article = service.get_article(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
