from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import auth, models, schemas
from ..database import get_db


router = APIRouter(tags=["reviews"])


def _review_to_out(review: models.Review) -> schemas.ReviewOut:
    """Build ReviewOut: user name, rating, comment only."""
    user_name = "Unknown"
    if review.user:
        user_name = review.user.full_name or review.user.email or "Unknown"
    # Rating 1-5; use 1 as fallback if legacy null in DB
    rating = review.rating if review.rating is not None else 1
    return schemas.ReviewOut(
        id=review.id,
        user_id=review.user_id,
        user_name=user_name,
        rating=rating,
        comment=review.comment,
        created_at=review.created_at,
    )


@router.get("/products/{product_id}/reviews", response_model=list[schemas.ReviewOut])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)):
    """List all reviews for a product. Public."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    reviews = (
        db.query(models.Review)
        .options(joinedload(models.Review.user))
        .filter(models.Review.product_id == product_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )
    return [_review_to_out(r) for r in reviews]


@router.post(
    "/products/{product_id}/reviews",
    response_model=schemas.ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    product_id: int,
    review_in: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """Add a review (comment) for a product. Requires authentication. One review per user per product."""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = db.query(models.Review).filter(
        models.Review.product_id == product_id,
        models.Review.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already reviewed this product")

    review = models.Review(
        user_id=current_user.id,
        product_id=product_id,
        comment=review_in.comment,
        rating=review_in.rating,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    # Reload with user for author
    review = db.query(models.Review).options(joinedload(models.Review.user)).filter(models.Review.id == review.id).first()
    return _review_to_out(review)


@router.get("/reviews/{review_id}", response_model=schemas.ReviewOut)
def get_review(review_id: int, db: Session = Depends(get_db)):
    """Get a single review by ID. Public."""
    review = (
        db.query(models.Review)
        .options(joinedload(models.Review.user))
        .filter(models.Review.id == review_id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return _review_to_out(review)


@router.put("/reviews/{review_id}", response_model=schemas.ReviewOut)
def update_review(
    review_id: int,
    review_in: schemas.ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """Update your own review. Requires authentication."""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own review")

    if review_in.comment is not None:
        review.comment = review_in.comment
    if review_in.rating is not None:
        review.rating = review_in.rating
    review.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(review)
    review = db.query(models.Review).options(joinedload(models.Review.user)).filter(models.Review.id == review.id).first()
    return _review_to_out(review)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """Delete your own review or any review if admin. Requires authentication."""
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own review")

    db.delete(review)
    db.commit()
    return None
