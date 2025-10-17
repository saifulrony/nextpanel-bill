"""
Domain Provider Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.domain_providers import DomainProviderType, DomainProviderStatus

class DomainProviderBase(BaseModel):
    name: str = Field(..., description="Provider name")
    type: DomainProviderType = Field(..., description="Provider type")
    is_default: bool = Field(False, description="Is this the default provider for this type")
    is_sandbox: bool = Field(True, description="Is this a sandbox/test environment")
    
    # API Configuration
    api_url: Optional[str] = Field(None, description="API endpoint URL")
    api_key: Optional[str] = Field(None, description="API key/username")
    api_secret: Optional[str] = Field(None, description="API secret/password")
    api_token: Optional[str] = Field(None, description="OAuth token")
    
    # Provider-specific settings
    settings: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional provider-specific configuration")
    
    # Pricing configuration
    pricing_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="TLD pricing, markup settings, etc.")
    
    # Features supported
    supports_registration: bool = Field(True, description="Supports domain registration")
    supports_transfer: bool = Field(True, description="Supports domain transfers")
    supports_renewal: bool = Field(True, description="Supports domain renewals")
    supports_dns_management: bool = Field(True, description="Supports DNS management")
    supports_whois_privacy: bool = Field(True, description="Supports WHOIS privacy")
    
    # Rate limiting
    rate_limit_per_minute: str = Field("60", description="Rate limit per minute")
    rate_limit_per_hour: str = Field("1000", description="Rate limit per hour")

class DomainProviderCreate(DomainProviderBase):
    pass

class DomainProviderUpdate(BaseModel):
    name: Optional[str] = None
    is_default: Optional[bool] = None
    is_sandbox: Optional[bool] = None
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    api_token: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    pricing_config: Optional[Dict[str, Any]] = None
    supports_registration: Optional[bool] = None
    supports_transfer: Optional[bool] = None
    supports_renewal: Optional[bool] = None
    supports_dns_management: Optional[bool] = None
    supports_whois_privacy: Optional[bool] = None
    rate_limit_per_minute: Optional[str] = None
    rate_limit_per_hour: Optional[str] = None

class DomainProviderResponse(DomainProviderBase):
    id: str
    status: DomainProviderStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_tested_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DomainProviderTestRequest(BaseModel):
    test_domain: Optional[str] = Field("example.com", description="Domain to test with")
    test_type: str = Field("connection", description="Type of test to perform")

class DomainProviderTestResponse(BaseModel):
    success: bool
    message: str
    response_time_ms: Optional[int] = None
    details: Optional[Dict[str, Any]] = None

# Provider-specific configuration schemas
class NamecheapConfig(BaseModel):
    api_user: str = Field(..., description="Namecheap API User")
    api_key: str = Field(..., description="Namecheap API Key")
    client_ip: str = Field(..., description="Client IP address")
    sandbox: bool = Field(True, description="Use sandbox environment")

class ResellerClubConfig(BaseModel):
    reseller_id: str = Field(..., description="ResellerClub Reseller ID")
    api_key: str = Field(..., description="ResellerClub API Key")
    sandbox: bool = Field(True, description="Use sandbox environment")

class GoDaddyConfig(BaseModel):
    api_key: str = Field(..., description="GoDaddy API Key")
    api_secret: str = Field(..., description="GoDaddy API Secret")
    sandbox: bool = Field(True, description="Use sandbox environment")

class CloudflareConfig(BaseModel):
    api_token: str = Field(..., description="Cloudflare API Token")
    account_id: str = Field(..., description="Cloudflare Account ID")

class GoogleDomainsConfig(BaseModel):
    client_id: str = Field(..., description="Google OAuth Client ID")
    client_secret: str = Field(..., description="Google OAuth Client Secret")
    refresh_token: str = Field(..., description="Google OAuth Refresh Token")

class NamecomConfig(BaseModel):
    username: str = Field(..., description="Name.com Username")
    api_token: str = Field(..., description="Name.com API Token")
    sandbox: bool = Field(True, description="Use sandbox environment")

class EnomConfig(BaseModel):
    reseller_id: str = Field(..., description="eNom Reseller ID")
    api_key: str = Field(..., description="eNom API Key")
    sandbox: bool = Field(True, description="Use sandbox environment")
