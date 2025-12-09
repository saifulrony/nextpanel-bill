"""
Tax Rules and Management Models
"""
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class TaxType(str, enum.Enum):
    VAT = "vat"
    GST = "gst"
    SALES_TAX = "sales_tax"
    CUSTOM = "custom"


class TaxRuleType(str, enum.Enum):
    COUNTRY = "country"
    STATE = "state"
    CITY = "city"
    PRODUCT = "product"
    CUSTOMER = "customer"


class TaxRule(Base):
    """Tax Rules"""
    __tablename__ = "tax_rules"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    tax_type = Column(Enum(TaxType), nullable=False)
    rule_type = Column(Enum(TaxRuleType), nullable=False)
    
    # Rate
    rate = Column(Float, nullable=False)  # Percentage (e.g., 20.0 for 20%)
    
    # Applicability
    country_code = Column(String(2))  # ISO country code (US, GB, etc.)
    state_code = Column(String(10))  # State/Province code
    city = Column(String(100))
    
    # Product/Customer restrictions
    applicable_to_products = Column(String)  # Comma-separated product IDs
    applicable_to_categories = Column(String)  # Comma-separated categories
    customer_tax_id_required = Column(Boolean, default=False)
    
    # Priority (higher priority rules apply first)
    priority = Column(String(10), default="0")
    
    # Settings
    is_active = Column(Boolean, default=True)
    is_compound = Column(Boolean, default=False)  # Compound tax (tax on tax)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TaxExemption(Base):
    """Tax Exemptions"""
    __tablename__ = "tax_exemptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    tax_rule_id = Column(String(36), ForeignKey("tax_rules.id"))
    
    # Exemption details
    exemption_reason = Column(Text)
    tax_id = Column(String(100))  # Tax exemption ID/certificate number
    certificate_file = Column(String(500))  # Path to certificate
    
    # Validity
    valid_from = Column(DateTime(timezone=True))
    valid_until = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    tax_rule = relationship("TaxRule")

