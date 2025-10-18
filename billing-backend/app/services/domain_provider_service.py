"""
Domain Provider Service
"""
import httpx
import asyncio
import time
from typing import Dict, Any, Optional
from app.models.domain_providers import DomainProvider, DomainProviderType
from app.schemas.domain_providers import DomainProviderTestResponse
from app.services.namecheap_service import NamecheapService
from app.services.resellerclub_service import ResellerClubService
from app.services.godaddy_service import GoDaddyService
from app.services.cloudflare_service import CloudflareService
import logging

logger = logging.getLogger(__name__)

class DomainProviderService:
    """Service for managing domain provider operations"""
    
    def __init__(self, provider: DomainProvider):
        self.provider = provider
        self.service = self._get_provider_service()
    
    def _get_provider_service(self):
        """Get the appropriate service based on provider type"""
        if self.provider.type == DomainProviderType.NAMECHEAP:
            return NamecheapService(
                api_user=self.provider.settings.get("api_username", "") or self.provider.api_key or "",
                api_key=self.provider.api_secret or "",
                username=self.provider.settings.get("api_username", "") or self.provider.api_key or "",
                client_ip=self.provider.settings.get("client_ip", "127.0.0.1"),
                sandbox=self.provider.is_sandbox
            )
        elif self.provider.type == DomainProviderType.RESELLERCLUB:
            return ResellerClubService(
                reseller_id=self.provider.api_key or "",
                api_key=self.provider.api_secret or "",
                sandbox=self.provider.is_sandbox
            )
        elif self.provider.type == DomainProviderType.GODADDY:
            return GoDaddyService(
                api_key=self.provider.api_key or "",
                api_secret=self.provider.api_secret or "",
                sandbox=self.provider.is_sandbox
            )
        elif self.provider.type == DomainProviderType.CLOUDFLARE:
            return CloudflareService(
                api_token=self.provider.api_token or "",
                account_id=self.provider.settings.get("account_id", "")
            )
        else:
            raise ValueError(f"Unsupported provider type: {self.provider.type}")
    
    async def test_connection(self, test_domain: str = "example.com") -> DomainProviderTestResponse:
        """Test the provider connection"""
        start_time = time.time()
        
        try:
            # Test basic connectivity
            if hasattr(self.service, 'test_connection'):
                result = await self.service.test_connection()
            else:
                # Fallback to domain availability check
                result = await self.service.check_domain_availability(test_domain)
            
            response_time = int((time.time() - start_time) * 1000)
            
            if result.get("success", False):
                return DomainProviderTestResponse(
                    success=True,
                    message="Connection test successful",
                    response_time_ms=response_time,
                    details=result
                )
            else:
                return DomainProviderTestResponse(
                    success=False,
                    message=result.get("message", "Connection test failed"),
                    response_time_ms=response_time,
                    details=result
                )
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)
            logger.error(f"Provider test failed for {self.provider.type}: {str(e)}")
            return DomainProviderTestResponse(
                success=False,
                message=f"Test failed: {str(e)}",
                response_time_ms=response_time
            )
    
    async def check_domain_availability(self, domain_name: str) -> Dict[str, Any]:
        """Check domain availability"""
        try:
            # Check if the service expects a list or single domain
            if hasattr(self.service, 'check_domain_availability'):
                # For NamecheapService, pass as a list
                if self.provider.type.value == 'namecheap':
                    availability_result = await self.service.check_domain_availability([domain_name])
                    logger.info(f"Namecheap availability result for {domain_name}: {availability_result}")
                    is_available = availability_result.get(domain_name, False)
                    logger.info(f"Final availability for {domain_name}: {is_available}")
                    return {"success": True, "available": is_available, "domain": domain_name}
                else:
                    # For other services, pass as single domain
                    return await self.service.check_domain_availability(domain_name)
            else:
                return {"success": False, "message": "Domain availability check not supported by this provider"}
        except Exception as e:
            logger.error(f"Domain availability check failed: {str(e)}")
            # Return success: False so domain service can fall back to mock
            return {"success": False, "message": str(e), "available": False}
    
    async def get_domain_pricing(self, domain_name: str) -> Dict[str, Any]:
        """Get domain pricing information"""
        try:
            if hasattr(self.service, 'get_domain_pricing'):
                return await self.service.get_domain_pricing(domain_name)
            else:
                return {"success": False, "message": "Pricing not supported by this provider"}
        except Exception as e:
            logger.error(f"Domain pricing check failed: {str(e)}")
            return {"success": False, "message": str(e)}
    
    async def register_domain(self, domain_name: str, years: int, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a domain"""
        try:
            return await self.service.register_domain(domain_name, years, customer_data)
        except Exception as e:
            logger.error(f"Domain registration failed: {str(e)}")
            return {"success": False, "message": str(e)}
    
    async def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Get domain information"""
        try:
            return await self.service.get_domain_info(domain_name)
        except Exception as e:
            logger.error(f"Domain info retrieval failed: {str(e)}")
            return {"success": False, "message": str(e)}
    
    async def update_nameservers(self, domain_name: str, nameservers: list) -> Dict[str, Any]:
        """Update domain nameservers"""
        try:
            if hasattr(self.service, 'set_nameservers'):
                return await self.service.set_nameservers(domain_name, nameservers)
            else:
                return {"success": False, "message": "Nameserver management not supported by this provider"}
        except Exception as e:
            logger.error(f"Nameserver update failed: {str(e)}")
            return {"success": False, "message": str(e)}
    
    def get_provider_config_template(self) -> Dict[str, Any]:
        """Get configuration template for the provider type"""
        templates = {
            DomainProviderType.NAMECHEAP: {
                "api_url": "https://api.sandbox.namecheap.com/xml.response",
                "required_fields": ["api_user", "api_key", "client_ip"],
                "optional_fields": ["sandbox"],
                "description": "Namecheap API configuration"
            },
            DomainProviderType.RESELLERCLUB: {
                "api_url": "https://test.httpapi.com/api/",
                "required_fields": ["reseller_id", "api_key"],
                "optional_fields": ["sandbox"],
                "description": "ResellerClub API configuration"
            },
            DomainProviderType.GODADDY: {
                "api_url": "https://api.ote-godaddy.com/v1",
                "required_fields": ["api_key", "api_secret"],
                "optional_fields": ["sandbox"],
                "description": "GoDaddy API configuration"
            },
            DomainProviderType.CLOUDFLARE: {
                "api_url": "https://api.cloudflare.com/client/v4",
                "required_fields": ["api_token", "account_id"],
                "optional_fields": [],
                "description": "Cloudflare API configuration"
            }
        }
        
        return templates.get(self.provider.type, {
            "api_url": "",
            "required_fields": [],
            "optional_fields": [],
            "description": "Custom provider configuration"
        })
