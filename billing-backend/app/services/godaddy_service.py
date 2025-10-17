"""
GoDaddy API Service
"""
import httpx
import logging
from typing import Dict, Any, Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class GoDaddyService:
    """
    Service for interacting with the GoDaddy API.
    Documentation: https://developer.godaddy.com/doc
    """
    
    def __init__(self, api_key: str, api_secret: str, sandbox: bool = True):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://api.ote-godaddy.com/v1" if sandbox else "https://api.godaddy.com/v1"
        self.sandbox = sandbox
        
        logger.info(f"Initialized GoDaddyService (Sandbox: {sandbox})")

    async def _call_api(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Helper to call GoDaddy API"""
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Authorization": f"sso-key {self.api_key}:{self.api_secret}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                if method.upper() == "GET":
                    response = await client.get(url, headers=headers, timeout=30)
                elif method.upper() == "POST":
                    response = await client.post(url, headers=headers, json=data, timeout=30)
                elif method.upper() == "PUT":
                    response = await client.put(url, headers=headers, json=data, timeout=30)
                elif method.upper() == "PATCH":
                    response = await client.patch(url, headers=headers, json=data, timeout=30)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                
                # GoDaddy returns JSON responses
                if response.headers.get("content-type", "").startswith("application/json"):
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": True, "message": response.text}
                
        except httpx.RequestError as exc:
            logger.error(f"GoDaddy API request error for {method} {endpoint}: {exc}")
            raise Exception(f"GoDaddy API request failed: {exc}")
        except httpx.HTTPStatusError as exc:
            logger.error(f"GoDaddy API HTTP error for {method} {endpoint}: {exc.response.status_code} - {exc.response.text}")
            raise Exception(f"GoDaddy API HTTP error: {exc.response.status_code} - {exc.response.text}")
        except Exception as exc:
            logger.error(f"Unexpected error calling GoDaddy API {method} {endpoint}: {exc}")
            raise Exception(f"Unexpected error: {exc}")

    async def test_connection(self) -> Dict[str, Any]:
        """Test API connection"""
        try:
            result = await self._call_api("GET", "/domains")
            return result
        except Exception as e:
            return {"success": False, "message": f"Connection test failed: {str(e)}"}

    async def check_domain_availability(self, domain_name: str) -> Dict[str, Any]:
        """Check if a domain is available for registration"""
        try:
            result = await self._call_api("GET", f"/domains/available?domain={domain_name}")
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain availability check failed: {str(e)}"}

    async def get_domain_pricing(self, domain_name: str) -> Dict[str, Any]:
        """Get domain pricing information"""
        tld = domain_name.split('.')[-1]
        try:
            result = await self._call_api("GET", f"/domains/tlds/{tld}")
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain pricing check failed: {str(e)}"}

    async def register_domain(self, domain_name: str, years: int, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a domain"""
        registration_data = {
            "domain": domain_name,
            "period": years,
            "privacy": customer_data.get("privacy", True),
            "renewAuto": customer_data.get("auto_renew", True),
            "nameServers": customer_data.get("nameservers", []),
            "contactAdmin": customer_data.get("admin_contact", {}),
            "contactBilling": customer_data.get("billing_contact", {}),
            "contactRegistrant": customer_data.get("registrant_contact", {}),
            "contactTech": customer_data.get("tech_contact", {})
        }
        
        try:
            result = await self._call_api("POST", "/domains/purchase", registration_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain registration failed: {str(e)}"}

    async def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Get detailed information about a domain"""
        try:
            result = await self._call_api("GET", f"/domains/{domain_name}")
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain info retrieval failed: {str(e)}"}

    async def set_nameservers(self, domain_name: str, nameservers: List[str]) -> Dict[str, Any]:
        """Set custom nameservers for a domain"""
        nameserver_data = {"nameServers": nameservers}
        
        try:
            result = await self._call_api("PUT", f"/domains/{domain_name}/nameservers", nameserver_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Nameserver update failed: {str(e)}"}

    async def get_nameservers(self, domain_name: str) -> Dict[str, Any]:
        """Get current nameservers for a domain"""
        try:
            result = await self._call_api("GET", f"/domains/{domain_name}/nameservers")
            return result
        except Exception as e:
            return {"success": False, "message": f"Nameserver retrieval failed: {str(e)}"}

    async def renew_domain(self, domain_name: str, years: int) -> Dict[str, Any]:
        """Renew a domain"""
        renewal_data = {
            "period": years,
            "privacy": True,
            "renewAuto": True
        }
        
        try:
            result = await self._call_api("POST", f"/domains/{domain_name}/renew", renewal_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain renewal failed: {str(e)}"}

    async def transfer_domain(self, domain_name: str, auth_code: str, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transfer a domain"""
        transfer_data = {
            "authCode": auth_code,
            "privacy": customer_data.get("privacy", True),
            "renewAuto": customer_data.get("auto_renew", True),
            "nameServers": customer_data.get("nameservers", []),
            "contactAdmin": customer_data.get("admin_contact", {}),
            "contactBilling": customer_data.get("billing_contact", {}),
            "contactRegistrant": customer_data.get("registrant_contact", {}),
            "contactTech": customer_data.get("tech_contact", {})
        }
        
        try:
            result = await self._call_api("POST", f"/domains/{domain_name}/transfer", transfer_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain transfer failed: {str(e)}"}

    async def get_domain_suggestions(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """Get domain name suggestions"""
        try:
            result = await self._call_api("GET", f"/domains/suggest?query={query}&limit={limit}")
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain suggestions failed: {str(e)}"}
