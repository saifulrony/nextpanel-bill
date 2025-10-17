"""
Domain Service - Handles domain operations
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from app.services.namecheap_service import NamecheapService
from app.core.config import settings

logger = logging.getLogger(__name__)

class DomainService:
    """Service for domain operations"""
    
    def __init__(self):
        self.namecheap_service = None
        self._initialize_services()
    
    def _initialize_services(self):
        """Initialize domain registrar services"""
        try:
            # Initialize Namecheap service if credentials are available
            if hasattr(settings, 'NAMECHEAP_API_USER') and settings.NAMECHEAP_API_USER:
                self.namecheap_service = NamecheapService(
                    api_user=settings.NAMECHEAP_API_USER,
                    api_key=settings.NAMECHEAP_API_KEY,
                    client_ip=settings.NAMECHEAP_CLIENT_IP,
                    sandbox=getattr(settings, 'NAMECHEAP_SANDBOX', True)
                )
                logger.info("Namecheap service initialized")
            else:
                logger.warning("Namecheap credentials not configured, using mock responses")
        except Exception as e:
            logger.error(f"Failed to initialize domain services: {e}")
    
    async def check_availability(self, domain_name: str) -> bool:
        """Check if a domain is available for registration"""
        try:
            if self.namecheap_service:
                result = await self.namecheap_service.check_domain_availability(domain_name)
                return result.get('success', False)
            else:
                # Mock response for testing
                return await self._mock_availability_check(domain_name)
                
        except Exception as e:
            logger.error(f"Error checking domain availability for {domain_name}: {e}")
            return False
    
    async def get_domain_price(self, domain_name: str) -> Dict[str, Any]:
        """Get pricing information for a domain"""
        try:
            if self.namecheap_service:
                # This would call the actual Namecheap pricing API
                # For now, return mock pricing
                return await self._mock_pricing(domain_name)
            else:
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
        mock_taken_patterns = ['test', 'example', 'demo', 'admin', 'www']
        base_name = domain_name.split('.')[0].lower()
        
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