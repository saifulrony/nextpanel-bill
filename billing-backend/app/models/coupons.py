"""
Coupon and Promotional Code Models
"""
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Integer, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class CouponType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_SHIPPING = "free_shipping"


class CouponStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"


class Coupon(Base):
    """Coupon/Promotional Code"""
    __tablename__ = "coupons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Discount details
    coupon_type = Column(Enum(CouponType), nullable=False, default=CouponType.PERCENTAGE)
    discount_value = Column(Float, nullable=False)  # Percentage or fixed amount
    minimum_purchase = Column(Float, default=0.0)  # Minimum order amount
    maximum_discount = Column(Float)  # Max discount for percentage coupons
    
    # Usage limits
    usage_limit = Column(Integer)  # Total times coupon can be used (None = unlimited)
    usage_count = Column(Integer, default=0)  # Current usage count
    usage_limit_per_user = Column(Integer, default=1)  # Times per user
    
    # Validity
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_until = Column(DateTime(timezone=True))
    status = Column(Enum(CouponStatus), default=CouponStatus.ACTIVE)
    
    # Restrictions
    applicable_to_products = Column(String)  # Comma-separated product IDs
    applicable_to_categories = Column(String)  # Comma-separated categories
    first_time_customers_only = Column(Boolean, default=False)
    first_billing_period_only = Column(Boolean, default=False)  # Discount applies only to first billing period (e.g., first year)
    
    # Metadata
    created_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    usages = relationship("CouponUsage", back_populates="coupon", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class CouponUsage(Base):
    """Track coupon usage"""
    __tablename__ = "coupon_usages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    coupon_id = Column(String(36), ForeignKey("coupons.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    order_id = Column(String(36), ForeignKey("orders.id"))
    invoice_id = Column(String(36), ForeignKey("invoices.id"))
    discount_amount = Column(Float, nullable=False)
    used_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    coupon = relationship("Coupon", back_populates="usages")
    user = relationship("User")
    order = relationship("Order")
    invoice = relationship("Invoice")

