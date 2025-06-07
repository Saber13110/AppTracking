from fastapi import APIRouter
from .endpoints import tracking, notifications, colis

api_router = APIRouter()

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