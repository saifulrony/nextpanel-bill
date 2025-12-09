"""
Email Template Models
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class EmailTemplateType(str, enum.Enum):
    WELCOME = "welcome"
    PAYMENT_CONFIRMATION = "payment_confirmation"
    INVOICE_GENERATED = "invoice_generated"
    PAYMENT_FAILED = "payment_failed"
    RENEWAL_REMINDER = "renewal_reminder"
    TRIAL_ENDING = "trial_ending"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"
    SUBSCRIPTION_EXPIRED = "subscription_expired"
    SERVICE_SUSPENDED = "service_suspended"
    ORDER_CONFIRMATION = "order_confirmation"
    CUSTOM = "custom"


class EmailTemplate(Base):
    """Email Templates"""
    __tablename__ = "email_templates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    template_type = Column(Enum(EmailTemplateType), nullable=False)
    subject = Column(String(500), nullable=False)
    
    # Content
    body_text = Column(Text)  # Plain text version
    body_html = Column(Text)  # HTML version
    
    # Variables/Placeholders (JSON array of available variables)
    available_variables = Column(String)  # JSON array: ["{{customer_name}}", "{{invoice_number}}", etc.]
    
    # Settings
    is_active = Column(Boolean, default=True)
    is_system = Column(Boolean, default=False)  # System templates can't be deleted
    
    # Metadata
    created_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])

