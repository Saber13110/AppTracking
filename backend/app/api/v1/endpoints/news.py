from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ....database import get_db
from ....services.news_service import NewsArticleService
from ....models.news import NewsArticle, NewsArticleCreate, NewsArticleUpdate
from ....services.auth import require_role
from ....models.user import UserDB, UserRole

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


@router.post("/", response_model=NewsArticle)
def create_article(
    article: NewsArticleCreate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(UserRole.admin)),
):
    service = NewsArticleService(db)
    return service.create_article(article)


@router.patch("/{slug}", response_model=NewsArticle)
def update_article(
    slug: str,
    updates: NewsArticleUpdate,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(UserRole.admin)),
):
    service = NewsArticleService(db)
    existing = service.get_article(slug)
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    updated = service.update_article(existing.id, updates)
    return updated


@router.delete("/{slug}")
def delete_article(
    slug: str,
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(require_role(UserRole.admin)),
):
    service = NewsArticleService(db)
    existing = service.get_article(slug)
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")
    deleted = service.delete_article(existing.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"deleted": deleted}
