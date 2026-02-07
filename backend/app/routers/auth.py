from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = auth.get_user_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered. Please use a different email")

    try:
        hashed_password = auth.get_password_hash(user_in.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password hashing error: {str(e)}"
        )

    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = auth.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please try again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(subject=user.email)
    return schemas.Token(access_token=access_token)


@router.post("/logout")
def logout():
    # Stateless JWT: client should discard the token.
    return {"detail": "Logged out (client-side token invalidation)."}


@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_users_me(
    user_in: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user),
):
    """Update current user's full_name, email, and/or password. Only provided fields are updated."""
    if user_in.email is not None:
        existing = auth.get_user_by_email(db, email=user_in.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered. Please use a different email.",
            )
        current_user.email = user_in.email

    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name

    if user_in.password is not None and user_in.password != "":
        try:
            current_user.hashed_password = auth.get_password_hash(user_in.password)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )

    db.commit()
    db.refresh(current_user)
    return current_user

