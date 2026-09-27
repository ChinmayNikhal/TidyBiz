"""Business workspace endpoint (API.md §4)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Business
from app.schemas.business import BusinessRead

router = APIRouter(tags=["business"])


@router.get("/business", response_model=BusinessRead)
def get_business(db: Session = Depends(get_db)) -> Business:
    """Return the configured demo business workspace."""
    business = db.query(Business).first()
    if business is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business workspace not found")
    return business
