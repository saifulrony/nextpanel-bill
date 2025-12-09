"""
Currency and Exchange Rate Models
"""
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class Currency(Base):
    """Supported Currencies"""
    __tablename__ = "currencies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(3), unique=True, nullable=False, index=True)  # USD, EUR, GBP, etc.
    name = Column(String(100), nullable=False)  # US Dollar, Euro, etc.
    symbol = Column(String(10), nullable=False)  # $, €, £, etc.
    symbol_position = Column(String(10), default="before")  # before or after
    
    # Exchange rates
    exchange_rate_to_usd = Column(Float, default=1.0)  # Rate to USD
    is_base_currency = Column(Boolean, default=False)  # USD is base
    
    # Settings
    is_active = Column(Boolean, default=True)
    decimal_places = Column(String(10), default="2")  # Number of decimal places
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ExchangeRate(Base):
    """Historical Exchange Rates"""
    __tablename__ = "exchange_rates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    from_currency = Column(String(3), nullable=False, index=True)
    to_currency = Column(String(3), nullable=False, index=True)
    rate = Column(Float, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Source
    source = Column(String(50), default="manual")  # manual, api, etc.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

