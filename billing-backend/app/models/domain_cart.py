"""
Domain Cart Models
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class DomainCartItem(Base):
    """Domain cart item"""
    __tablename__ = "domain_cart_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    cart_id = Column(String(36), ForeignKey("domain_carts.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    domain_name = Column(String(255), nullable=False)
    domain_type = Column(String(50), nullable=False)  # 'regular', 'premium', 'auction'
    price = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    registration_period = Column(Integer, default=1)  # years
    is_available = Column(Boolean, default=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional fields for different domain types
    auction_end_time = Column(DateTime(timezone=True), nullable=True)
    current_bid = Column(Float, nullable=True)
    premium_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    # Relationships
    cart = relationship("DomainCart", back_populates="items")
    user = relationship("User", back_populates="domain_cart_items")

class DomainCart(Base):
    """Domain cart session"""
    __tablename__ = "domain_carts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    session_id = Column(String(255), nullable=True)  # For guest users
    total_items = Column(Integer, default=0)
    total_price = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="domain_carts")
    items = relationship("DomainCartItem", cascade="all, delete-orphan")
