"""
VPS API Key model for customer API key management
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import secrets


def generate_api_key():
    """Generate a secure API key"""
    return f"vps_{secrets.token_urlsafe(32)}"


class VPSAPIKey(Base):
    """API keys for customers to control their VPS servers"""
    __tablename__ = "vps_api_keys"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)  # User-friendly name for the key
    api_key = Column(String(255), unique=True, nullable=False, index=True)
    vps_panel_url = Column(String(500))  # URL of the VPS panel (e.g., http://192.168.10.203:12000)
    is_active = Column(Boolean, default=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional expiration
    description = Column(Text)  # Optional description
    permissions = Column(Text)  # JSON string of allowed permissions (start, stop, restart, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])

