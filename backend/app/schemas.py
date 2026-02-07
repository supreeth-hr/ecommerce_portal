import re
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from .models import OrderStatus, PaymentStatus, ProductCategory


# --------- Auth / Users ----------


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(
        min_length=8,
        max_length=128,
        description="Password must be 8-128 characters with uppercase, lowercase, digit, and special character"
    )

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password meets industry security standards."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if len(v) > 128:
            raise ValueError("Password must be no more than 128 characters long")
        
        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        
        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        
        # Check for at least one digit
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one digit")
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', v):
            raise ValueError("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)")
        
        return v


class UserUpdate(BaseModel):
    """Update current user; all fields optional."""
    full_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(
        None,
        min_length=8,
        max_length=128,
        description="Password must be 8-128 characters with uppercase, lowercase, digit, and special character",
    )

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == '':
            return v
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must be no more than 128 characters long")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserOut(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --------- Products ----------


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[ProductCategory] = None
    price: float
    image_url: Optional[str] = None
    stock: int = 0


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --------- Reviews ----------


class ReviewCreate(BaseModel):
    comment: str = Field(min_length=1, max_length=2000)
    rating: int = Field(ge=1, le=5, description="Stars out of 5")


class ReviewUpdate(BaseModel):
    comment: Optional[str] = Field(None, min_length=1, max_length=2000)
    rating: Optional[int] = Field(None, ge=1, le=5)


class ReviewOut(BaseModel):
    """Review response: user name, rating (stars 1-5), comment, and date."""
    id: int
    user_id: int
    user_name: str
    rating: int  # 1-5 stars
    comment: str
    created_at: datetime


# --------- Cart ----------


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=0)


class CartItemProduct(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    price: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class CartItemOut(BaseModel):
    id: int
    quantity: int
    product: CartItemProduct

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    items: List[CartItemOut]
    total_quantity: int
    total_amount: float


# --------- Orders & Payment ----------


class PaymentInfo(BaseModel):
    cardholder_name: str
    card_last4: str = Field(min_length=4, max_length=4)
    expiry_month: int = Field(ge=1, le=12)
    expiry_year: int = Field(ge=2024)


class OrderCreate(BaseModel):
    shipping_customer_name: Optional[str] = Field(None, max_length=255)
    shipping_address: Optional[str] = Field(None, max_length=1000)
    shipping_phone: Optional[str] = Field(None, max_length=32)
    shipping_email: Optional[EmailStr] = None
    payment: PaymentInfo

    @field_validator("shipping_phone")
    @classmethod
    def phone_ten_digits(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        digits = re.sub(r"\D", "", v)
        if len(digits) != 10:
            raise ValueError("Phone number must be exactly 10 digits")
        return digits


class OrderItemOut(BaseModel):
    id: int
    product: CartItemProduct
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    status: OrderStatus
    payment_status: PaymentStatus
    total_amount: float
    shipping_customer_name: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


class OrderSummary(BaseModel):
    id: int
    status: OrderStatus
    payment_status: PaymentStatus
    total_amount: float
    shipping_customer_name: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

