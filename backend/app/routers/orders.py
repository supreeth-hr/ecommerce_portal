from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db


router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    # Simulate payment processing: basic validation has already been done by Pydantic.
    payment_info = order_in.payment
    if not payment_info.card_last4.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid card information")

    cart_items = (
        db.query(models.CartItem)
        .join(models.Product)
        .filter(models.CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    total_amount = 0.0
    for item in cart_items:
        total_amount += item.quantity * item.product.price

    now = datetime.utcnow()
    order = models.Order(
        user_id=current_user.id,
        status=models.OrderStatus.CONFIRMED,
        payment_status=models.PaymentStatus.PAID,
        total_amount=total_amount,
        shipping_customer_name=order_in.shipping_customer_name,
        shipping_address=order_in.shipping_address,
        shipping_phone=order_in.shipping_phone,
        shipping_email=order_in.shipping_email,
        created_at=now,
        updated_at=now,
    )
    db.add(order)
    db.flush()  # ensure order.id is available

    for item in cart_items:
        product = item.product
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
            subtotal=item.quantity * product.price,
        )
        db.add(order_item)

        # Optionally decrease stock if tracking inventory
        if product.stock is not None and product.stock >= item.quantity:
            product.stock -= item.quantity

    # Clear cart after order is created
    db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
    db.commit()
    db.refresh(order)

    # Reload with items and product relationships
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order.id)
        .first()
    )
    return schemas.OrderOut.model_validate(order)


@router.get("", response_model=list[schemas.OrderSummary])
def list_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [schemas.OrderSummary.model_validate(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id, models.Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return schemas.OrderOut.model_validate(order)


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    status_value: models.OrderStatus,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(auth.get_current_admin_user),
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = status_value
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return schemas.OrderOut.model_validate(order)

