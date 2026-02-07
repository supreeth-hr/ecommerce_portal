from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import auth, models, schemas
from ..database import get_db


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/products", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user),
):
    """
    Create a new product. Requires admin authentication.
    """
    product = models.Product(
        name=product_in.name,
        description=product_in.description,
        category=product_in.category.value if product_in.category else None,
        price=product_in.price,
        image_url=product_in.image_url,
        stock=product_in.stock,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/products/bulk", response_model=List[schemas.ProductOut], status_code=status.HTTP_201_CREATED)
def create_products_bulk(
    products_in: List[schemas.ProductCreate],
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user),
):
    """
    Create multiple products at once. Requires admin authentication.
    Useful for seeding the database with sample products.
    """
    products = []
    for product_in in products_in:
        product = models.Product(
            name=product_in.name,
            description=product_in.description,
            category=product_in.category.value if product_in.category else None,
            price=product_in.price,
            image_url=product_in.image_url,
            stock=product_in.stock,
        )
        db.add(product)
        products.append(product)
    
    db.commit()
    for product in products:
        db.refresh(product)
    
    return products


@router.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user),
):
    """
    Update an existing product. Requires admin authentication.
    """
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    product.name = product_in.name
    product.description = product_in.description
    product.category = product_in.category.value if product_in.category else None
    product.price = product_in.price
    product.image_url = product_in.image_url
    product.stock = product_in.stock
    
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user),
):
    """
    Delete a product. Requires admin authentication.
    """
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return None
