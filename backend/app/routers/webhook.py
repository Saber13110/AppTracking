from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
import hmac
import hashlib
import secrets
import json

from ..config import settings
from ..database import get_db
from ..services.tracking_service import TrackingService

router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/fedex")
async def fedex_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle FedEx webhook notifications."""
    body_bytes = await request.body()
    signature = request.headers.get("X-Fedex-Signature")
    secret = settings.FEDEX_WEBHOOK_SECRET
    if signature and secret:
        digest = hmac.new(
            secret.encode(), body_bytes, hashlib.sha256
        ).hexdigest()
        if not secrets.compare_digest(digest, signature):
            raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        payload = json.loads(body_bytes.decode())
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    tracking_number = (
        payload.get("tracking_number")
        or payload.get("trackingNumber")
        or payload.get("TrackNo")
    )
    if tracking_number:
        service = TrackingService(db)
        service.track_single_package(tracking_number)

    return {"success": True}
