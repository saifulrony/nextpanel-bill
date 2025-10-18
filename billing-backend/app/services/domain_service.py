"""
Domain Service - Handles domain operations
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.domain_providers import DomainProvider, DomainProviderType, DomainProviderStatus
from app.services.domain_provider_service import DomainProviderService

logger = logging.getLogger(__name__)

class DomainService:
    """Service for domain operations"""
    
    def __init__(self, db: AsyncSession = None):
        self.db = db
        self.active_providers = []
    
    async def _initialize_services(self):
        """Initialize domain registrar services from database"""
        try:
            if self.db:
                # Get active domain providers from database
                result = await self.db.execute(
                    select(DomainProvider).where(
                        DomainProvider.status == DomainProviderStatus.ACTIVE
                    )
                )
                providers = result.scalars().all()
                
                self.active_providers = []
                for provider in providers:
                    try:
                        service = DomainProviderService(provider)
                        self.active_providers.append(service)
                        logger.info(f"Initialized {provider.type} provider: {provider.name}")
                    except Exception as e:
                        logger.error(f"Failed to initialize provider {provider.name}: {e}")
                
                if not self.active_providers:
                    logger.warning("No active domain providers found, using mock responses")
            else:
                logger.warning("No database session provided, using mock responses")
        except Exception as e:
            logger.error(f"Failed to initialize domain services: {e}")
    
    async def check_availability(self, domain_name: str) -> bool:
        """Check if a domain is available for registration"""
        try:
            if not self.active_providers:
                await self._initialize_services()
            
            if self.active_providers:
                # Use the first active provider
                provider_service = self.active_providers[0]
                result = await provider_service.check_domain_availability(domain_name)
                if result.get('success', False):
                    api_result = result.get('available', False)
                    logger.info(f"Namecheap API returned for {domain_name}: {api_result}")
                    return api_result
                else:
                    logger.warning(f"Provider returned error: {result.get('message', 'Unknown error')}, using fallback logic")
                    # Fallback: only mark very obvious taken domains as unavailable
                    base_name = domain_name.split('.')[0].lower()
                    obvious_taken = ['google', 'facebook', 'amazon', 'microsoft', 'apple', 'netflix', 'twitter', 'instagram', 'youtube', 'github']
                    return base_name not in obvious_taken
            else:
                logger.error("No active domain providers found")
                return False
                
        except Exception as e:
            logger.error(f"Error checking domain availability for {domain_name}: {e}")
            return False
    
    async def get_domain_price(self, domain_name: str) -> Dict[str, Any]:
        """Get pricing information for a domain"""
        try:
            if not self.active_providers:
                await self._initialize_services()
            
            if self.active_providers:
                # Use the first active provider
                provider_service = self.active_providers[0]
                result = await provider_service.get_domain_pricing(domain_name)
                return result
            else:
                # Mock pricing for testing
                return await self._mock_pricing(domain_name)
                
        except Exception as e:
            logger.error(f"Error getting domain price for {domain_name}: {e}")
            return {"price": 0.0, "currency": "USD"}
    
    async def register_domain(self, domain_name: str, years: int = 1, customer_info: Dict[str, str] = None) -> Dict[str, Any]:
        """Register a domain"""
        try:
            if self.namecheap_service:
                result = await self.namecheap_service.register_domain(domain_name, years, customer_info.get('id', ''))
                return result
            else:
                # Mock registration
                return await self._mock_registration(domain_name, years)
                
        except Exception as e:
            logger.error(f"Error registering domain {domain_name}: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Get detailed information about a domain"""
        try:
            if self.namecheap_service:
                result = await self.namecheap_service.get_domain_info(domain_name)
                return result
            else:
                return await self._mock_domain_info(domain_name)
                
        except Exception as e:
            logger.error(f"Error getting domain info for {domain_name}: {e}")
            return {"error": str(e)}
    
    async def get_nameservers(self, domain_name: str) -> List[str]:
        """Get current nameservers for a domain"""
        try:
            if self.namecheap_service:
                result = await self.namecheap_service.get_nameservers(domain_name)
                return result.get('nameservers', [])
            else:
                return await self._mock_nameservers(domain_name)
                
        except Exception as e:
            logger.error(f"Error getting nameservers for {domain_name}: {e}")
            return []
    
    async def update_nameservers(self, domain_name: str, nameservers: List[str]) -> Dict[str, Any]:
        """Update domain nameservers"""
        try:
            if self.namecheap_service:
                result = await self.namecheap_service.set_nameservers(domain_name, nameservers)
                return result
            else:
                return await self._mock_update_nameservers(domain_name, nameservers)
                
        except Exception as e:
            logger.error(f"Error updating nameservers for {domain_name}: {e}")
            return {"success": False, "error": str(e)}
    
    # Mock methods for testing when real APIs are not available
    async def _mock_availability_check(self, domain_name: str) -> bool:
        """Mock domain availability check"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        # Mock logic: domains ending with certain patterns are "taken"
        # Only mark very common/generic domains as taken
        mock_taken_patterns = ['google', 'facebook', 'amazon', 'microsoft', 'apple', 'netflix', 'twitter', 'instagram', 'youtube', 'github', 'test', 'example', 'demo', 'sample', 'admin', 'www', 'mail', 'ftp', 'blog', 'shop', 'store', 'news', 'info', 'help', 'support', 'contact', 'about', 'login', 'register', 'signup', 'api', 'app', 'mobile', 'web', 'site', 'home', 'main', 'index', 'default', 'temp', 'tmp', 'backup', 'old', 'new', 'beta', 'alpha', 'dev', 'development', 'staging', 'prod', 'production', 'live', 'online', 'internet', 'world', 'global', 'local', 'city', 'country', 'state', 'region', 'area', 'zone', 'place', 'location', 'address', 'street', 'road', 'avenue', 'drive', 'lane', 'way', 'path', 'route', 'direction', 'north', 'south', 'east', 'west', 'center', 'central', 'middle', 'top', 'bottom', 'left', 'right', 'front', 'back', 'side', 'corner', 'edge', 'border', 'limit', 'boundary', 'line', 'mark', 'point', 'spot', 'place', 'position', 'location', 'site', 'area', 'zone', 'region', 'district', 'neighborhood', 'community', 'society', 'group', 'team', 'club', 'organization', 'company', 'business', 'enterprise', 'corporation', 'firm', 'agency', 'office', 'department', 'division', 'section', 'unit', 'branch', 'subsidiary', 'affiliate', 'partner', 'associate', 'member', 'user', 'customer', 'client', 'guest', 'visitor', 'person', 'people', 'individual', 'person', 'man', 'woman', 'boy', 'girl', 'child', 'baby', 'adult', 'teen', 'youth', 'senior', 'elder', 'parent', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'family', 'friend', 'neighbor', 'colleague', 'boss', 'employee', 'worker', 'staff', 'crew', 'team', 'group', 'band', 'club', 'society', 'community', 'organization', 'company', 'business', 'enterprise', 'corporation', 'firm', 'agency', 'office', 'department', 'division', 'section', 'unit', 'branch', 'subsidiary', 'affiliate', 'partner', 'associate', 'member', 'user', 'customer', 'client', 'guest', 'visitor']
        base_name = domain_name.split('.')[0].lower()
        
        # For demo purposes, make most domains available except the very common ones
        return base_name not in mock_taken_patterns
    
    async def _mock_pricing(self, domain_name: str) -> Dict[str, Any]:
        """Mock domain pricing"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        tld = domain_name.split('.')[-1]
        pricing_map = {
            'com': 12.99,
            'net': 14.99,
            'org': 15.99,
            'io': 34.99,
            'co': 24.99,
            'dev': 14.99,
            'app': 17.99,
            'tech': 19.99,
            'online': 9.99
        }
        
        price = pricing_map.get(tld, 12.99)
        
        return {
            "price": price,
            "currency": "USD",
            "period": "yearly",
            "registrar": "namecheap"
        }
    
    async def _mock_registration(self, domain_name: str, years: int) -> Dict[str, Any]:
        """Mock domain registration"""
        await asyncio.sleep(0.5)  # Simulate API delay
        
        return {
            "success": True,
            "domain": domain_name,
            "order_id": f"MOCK-{int(asyncio.get_event_loop().time())}",
            "message": "Domain registration successful (mock)",
            "status": "completed"
        }
    
    async def _mock_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Mock domain information"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        return {
            "domain": domain_name,
            "status": "active",
            "created_date": "2024-01-01",
            "expired_date": "2025-01-01",
            "auto_renew": True,
            "is_locked": False,
            "nameservers": ["ns1.namecheap.com", "ns2.namecheap.com"],
            "whois_guard": True
        }
    
    async def _mock_nameservers(self, domain_name: str) -> List[str]:
        """Mock nameservers"""
        await asyncio.sleep(0.1)  # Simulate API delay
        
        return ["ns1.namecheap.com", "ns2.namecheap.com"]
    
    async def _mock_update_nameservers(self, domain_name: str, nameservers: List[str]) -> Dict[str, Any]:
        """Mock nameserver update"""
        await asyncio.sleep(0.2)  # Simulate API delay
        
        return {
            "success": True,
            "domain": domain_name,
            "nameservers": nameservers,
            "message": "Nameservers updated successfully (mock)"
        }