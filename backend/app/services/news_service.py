from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.news import NewsArticleDB, NewsArticleCreate, NewsArticleUpdate


class NewsArticleService:
    def __init__(self, db: Session):
        self.db = db

    def create_article(self, article: NewsArticleCreate) -> NewsArticleDB:
        db_article = NewsArticleDB(**article.model_dump())
        self.db.add(db_article)
        self.db.commit()
        self.db.refresh(db_article)
        return db_article

    def get_article(self, slug: str) -> Optional[NewsArticleDB]:
        return self.db.query(NewsArticleDB).filter(NewsArticleDB.slug == slug).first()

    def get_articles(self, skip: int = 0, limit: int = 100) -> List[NewsArticleDB]:
        return (
            self.db.query(NewsArticleDB)
            .order_by(NewsArticleDB.date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_article(self, article_id: int, updates: NewsArticleUpdate) -> Optional[NewsArticleDB]:
        article = self.db.query(NewsArticleDB).filter(
            NewsArticleDB.id == article_id).first()
        if not article:
            return None
        for key, value in updates.model_dump(exclude_unset=True).items():
            setattr(article, key, value)
        self.db.commit()
        self.db.refresh(article)
        return article

    def delete_article(self, article_id: int) -> bool:
        article = self.db.query(NewsArticleDB).filter(
            NewsArticleDB.id == article_id).first()
        if not article:
            return False
        self.db.delete(article)
        self.db.commit()
        return True
