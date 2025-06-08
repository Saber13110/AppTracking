from __future__ import annotations
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from ..database import Base


class NewsArticleDB(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True)
    content = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    category = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class NewsArticleBase(BaseModel):
    title: str
    slug: str
    content: str
    image_url: Optional[str] = None
    date: Optional[datetime] = None
    category: Optional[str] = None
    summary: Optional[str] = None


class NewsArticleCreate(NewsArticleBase):
    pass


class NewsArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    date: Optional[datetime] = None
    category: Optional[str] = None
    summary: Optional[str] = None


class NewsArticle(NewsArticleBase):
    id: int

    class Config:
        from_attributes = True
