"""
Domain Provider Models
"""
from sqlalchemy import Column, String, Boolean, JSON, DateTime, func, Enum
from sqlalchemy.ext.declarative import declarative_base
from app.models import Base, generate_uuid
import enum

class DomainProviderType(str, enum.Enum):
    NAMECHEAP = "namecheap"
    RESELLERCLUB = "resellerclub"
    GODADDY = "godaddy"
    CLOUDFLARE = "cloudflare"
    GOOGLE_DOMAINS = "google_domains"
    NAMECOM = "namecom"
    ENOM = "enom"

class DomainProviderStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"
    ERROR = "error"

class DomainProvider(Base):
    """Domain registrar/provider configurations"""
    __tablename__ = "domain_providers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)  # e.g., "Namecheap Production"
    type = Column(Enum(DomainProviderType), nullable=False)
    status = Column(Enum(DomainProviderStatus), default=DomainProviderStatus.INACTIVE)
    is_default = Column(Boolean, default=False)
    is_sandbox = Column(Boolean, default=True)
    
    # API Configuration
    api_url = Column(String(500))  # API endpoint URL
    api_key = Column(String(500))  # API key/username
    api_secret = Column(String(500))  # API secret/password
    api_token = Column(String(500))  # OAuth token (if applicable)
    
    # Provider-specific settings
    settings = Column(JSON)  # Additional provider-specific configuration
    
    # Pricing configuration
    pricing_config = Column(JSON)  # TLD pricing, markup settings, etc.
    
    # Features supported
    supports_registration = Column(Boolean, default=True)
    supports_transfer = Column(Boolean, default=True)
    supports_renewal = Column(Boolean, default=True)
    supports_dns_management = Column(Boolean, default=True)
    supports_whois_privacy = Column(Boolean, default=True)
    
    # Rate limiting
    rate_limit_per_minute = Column(String(50), default="60")
    rate_limit_per_hour = Column(String(50), default="1000")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_tested_at = Column(DateTime(timezone=True))
    
    def __repr__(self):
        return f"<DomainProvider(name='{self.name}', type='{self.type}', status='{self.status}')>"
