from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime

class DomainPricingConfig(Base):
    __tablename__ = "domain_pricing_configs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Global settings
    default_markup_percentage = Column(Float, default=20.0)  # 20% markup by default
    use_wholesale_pricing = Column(Boolean, default=True)
    
    # Relationships
    tld_prices = relationship("TLDPricing", back_populates="config", cascade="all, delete-orphan")

class TLDPricing(Base):
    __tablename__ = "tld_pricings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id = Column(String(36), ForeignKey('domain_pricing_configs.id'), nullable=False)
    tld = Column(String(20), nullable=False)  # e.g., 'com', 'net', 'org'
    
    # Pricing options
    custom_price = Column(Float, nullable=True)  # Custom fixed price
    markup_percentage = Column(Float, nullable=True)  # Custom markup percentage
    wholesale_price = Column(Float, nullable=True)  # Wholesale price for calculation
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    config = relationship("DomainPricingConfig", back_populates="tld_prices")
    
    # Unique constraint
    __table_args__ = (
        {"extend_existing": True}
    )
