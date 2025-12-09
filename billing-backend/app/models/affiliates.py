"""
Affiliate and Referral System Models
"""
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Integer, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class AffiliateStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class CommissionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"


class Affiliate(Base):
    """Affiliate Accounts"""
    __tablename__ = "affiliates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    referral_code = Column(String(50), unique=True, nullable=False, index=True)
    
    # Commission settings
    commission_rate = Column(Float, default=10.0)  # Percentage
    commission_type = Column(String(20), default="percentage")  # percentage or fixed
    
    # Status
    status = Column(Enum(AffiliateStatus), default=AffiliateStatus.PENDING)
    
    # Payment settings
    payment_method = Column(String(50))  # bank, paypal, etc.
    payment_details = Column(Text)  # JSON with payment info
    minimum_payout = Column(Float, default=50.0)
    
    # Statistics
    total_referrals = Column(Integer, default=0)
    total_commission_earned = Column(Float, default=0.0)
    total_commission_paid = Column(Float, default=0.0)
    total_commission_pending = Column(Float, default=0.0)
    
    # Dates
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_payout_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    referrals = relationship("Referral", back_populates="affiliate")
    commissions = relationship("Commission", back_populates="affiliate")


class Referral(Base):
    """Referral Tracking"""
    __tablename__ = "referrals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    affiliate_id = Column(String(36), ForeignKey("affiliates.id"), nullable=False)
    referred_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    referral_code_used = Column(String(50), nullable=False)
    
    # Tracking
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    referrer_url = Column(String(500))
    
    # Status
    converted = Column(Boolean, default=False)  # Made a purchase
    conversion_date = Column(DateTime(timezone=True))
    
    # Dates
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    affiliate = relationship("Affiliate", back_populates="referrals")
    referred_user = relationship("User", foreign_keys=[referred_user_id])
    commissions = relationship("Commission", back_populates="referral")


class Commission(Base):
    """Commission Records"""
    __tablename__ = "commissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    affiliate_id = Column(String(36), ForeignKey("affiliates.id"), nullable=False)
    referral_id = Column(String(36), ForeignKey("referrals.id"))
    
    # Related transaction
    order_id = Column(String(36), ForeignKey("orders.id"))
    payment_id = Column(String(36), ForeignKey("payments.id"))
    
    # Commission details
    order_amount = Column(Float, nullable=False)
    commission_rate = Column(Float, nullable=False)
    commission_amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    
    # Status
    status = Column(Enum(CommissionStatus), default=CommissionStatus.PENDING)
    
    # Dates
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    approved_at = Column(DateTime(timezone=True))
    paid_at = Column(DateTime(timezone=True))
    
    # Relationships
    affiliate = relationship("Affiliate", back_populates="commissions")
    referral = relationship("Referral", back_populates="commissions")
    order = relationship("Order")
    payment = relationship("Payment")

