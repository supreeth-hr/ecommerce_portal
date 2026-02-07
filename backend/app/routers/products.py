from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/products", tags=["products"])


@router.get("/categories", response_model=list[dict])
def list_categories():
    """
    Return the fixed list of product categories.
    Use for filters, dropdowns, etc.
    """
    return [{"value": c.value, "label": c.value} for c in models.ProductCategory]


@router.get("", response_model=list[schemas.ProductOut])
def list_products(
    category: models.ProductCategory | None = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)
    if category is not None:
        query = query.filter(models.Product.category == category.value)
    products = query.order_by(models.Product.created_at.desc()).all()
    return products


@router.get("/search", response_model=list[schemas.ProductOut])
def search_products(
    q: str = Query(..., min_length=1, description="Search keywords"),
    db: Session = Depends(get_db),
):
    """
    Search products by keywords in name, description, and category.
    Case-insensitive partial matching.
    """
    search_term = f"%{q}%"
    products = (
        db.query(models.Product)
        .filter(
            or_(
                models.Product.name.ilike(search_term),
                models.Product.description.ilike(search_term),
                models.Product.category.ilike(search_term),
            )
        )
        .order_by(models.Product.created_at.desc())
        .all()
    )
    return products


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

