from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db


router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("", response_model=schemas.CartOut)
def get_cart(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    items = (
        db.query(models.CartItem)
        .join(models.Product)
        .filter(models.CartItem.user_id == current_user.id)
        .all()
    )

    cart_items_out = []
    total_quantity = 0
    total_amount = 0.0
    for item in items:
        product = item.product
        subtotal = item.quantity * product.price
        total_quantity += item.quantity
        total_amount += subtotal
        cart_items_out.append(
            schemas.CartItemOut(
                id=item.id,
                quantity=item.quantity,
                product=schemas.CartItemProduct.model_validate(product),
            )
        )

    return schemas.CartOut(
        items=cart_items_out,
        total_quantity=total_quantity,
        total_amount=total_amount,
    )


@router.post("/items", response_model=schemas.CartOut, status_code=status.HTTP_201_CREATED)
def add_cart_item(
    item_in: schemas.CartItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    product = db.query(models.Product).filter(models.Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    cart_item = (
        db.query(models.CartItem)
        .filter(
            models.CartItem.user_id == current_user.id,
            models.CartItem.product_id == item_in.product_id,
        )
        .first()
    )
    if cart_item:
        cart_item.quantity += item_in.quantity
    else:
        cart_item = models.CartItem(
            user_id=current_user.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
        )
        db.add(cart_item)

    db.commit()
    return get_cart(db=db, current_user=current_user)


@router.patch("/items/{item_id}", response_model=schemas.CartOut)
def update_cart_item(
    item_id: int,
    item_update: schemas.CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    cart_item = (
        db.query(models.CartItem)
        .filter(
            models.CartItem.id == item_id,
            models.CartItem.user_id == current_user.id,
        )
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    if item_update.quantity == 0:
        db.delete(cart_item)
    else:
        cart_item.quantity = item_update.quantity

    db.commit()
    return get_cart(db=db, current_user=current_user)


@router.delete("/items/{item_id}", response_model=schemas.CartOut)
def delete_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    cart_item = (
        db.query(models.CartItem)
        .filter(
            models.CartItem.id == item_id,
            models.CartItem.user_id == current_user.id,
        )
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    db.delete(cart_item)
    db.commit()
    return get_cart(db=db, current_user=current_user)


@router.delete("", response_model=schemas.CartOut)
def clear_cart(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
    db.commit()
    return get_cart(db=db, current_user=current_user)

