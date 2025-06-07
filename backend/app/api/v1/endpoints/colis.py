from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from ....models.colis import ColisCreate, ColisUpdate, ColisOut, ColisFilter, ColisSearchResponse
from ....services.colis_service import ColisService
from ....database import get_db
import os

router = APIRouter()

@router.post("/", response_model=ColisOut)
async def create_colis(
    colis: ColisCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new colis
    """
    colis_service = ColisService(db)
    try:
        return await colis_service.create_colis(colis)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ColisOut])
async def list_colis(
    db: Session = Depends(get_db)
):
    """
    List all colis
    """
    colis_service = ColisService(db)
    try:
        colis, _ = await colis_service.search_colis(ColisFilter(page=1, page_size=100))
        return colis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{identifier_type}/{value}", response_model=ColisOut)
async def get_colis(
    identifier_type: str,
    value: str,
    db: Session = Depends(get_db)
):
    """
    Get a colis by reference type and value
    """
    colis_service = ColisService(db)
    try:
        colis = await colis_service.get_colis_by_identifier(identifier_type, value)
        if not colis:
            raise HTTPException(status_code=404, detail="Colis not found")
        return colis
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{colis_id}", response_model=ColisOut)
async def update_colis(
    colis_id: str,
    colis_update: ColisUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a colis
    """
    colis_service = ColisService(db)
    try:
        updated_colis = await colis_service.update_colis(colis_id, colis_update)
        if not updated_colis:
            raise HTTPException(status_code=404, detail="Colis not found")
        return updated_colis
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=ColisSearchResponse)
async def search_colis(
    filters: ColisFilter,
    db: Session = Depends(get_db)
):
    """
    Search and filter colis records
    """
    colis_service = ColisService(db)
    try:
        colis, total = await colis_service.search_colis(filters)
        return {
            "items": colis,
            "total": total,
            "page": filters.page,
            "page_size": filters.page_size,
            "total_pages": (total + filters.page_size - 1) // filters.page_size
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=Dict[str, Any])
async def get_colis_stats(
    db: Session = Depends(get_db)
):
    """
    Get colis statistics
    """
    colis_service = ColisService(db)
    try:
        stats = await colis_service.get_colis_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/codebar-image/{value}")
async def get_codebar_image(
    value: str,
    db: Session = Depends(get_db)
):
    """
    Get barcode image
    """
    colis_service = ColisService(db)
    colis = await colis_service.get_colis_by_code_barre(value)
    if not colis:
        raise HTTPException(status_code=404, detail="Colis not found")

    image_path = os.path.join(colis_service.barcode_folder, f"{value}.png")
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(image_path, media_type="image/png") 