from fastapi import APIRouter
from .endpoints import tracking, notifications, colis, history, news

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(
    tracking.router,
    prefix="/track",
    tags=["tracking"]
)

api_router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["notifications"]
)

api_router.include_router(
    colis.router,
    prefix="/colis",
    tags=["colis"]
)

api_router.include_router(
    history.router,
    prefix="/history",
    tags=["history"]
)

api_router.include_router(
    news.router,
    prefix="/news",
    tags=["news"]
)
