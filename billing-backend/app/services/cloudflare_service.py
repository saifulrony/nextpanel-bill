"""
Cloudflare API Service
"""
import httpx
import logging
from typing import Dict, Any, Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class CloudflareService:
    """
    Service for interacting with the Cloudflare API.
    Documentation: https://developers.cloudflare.com/api/
    """
    
    def __init__(self, api_token: str, account_id: str):
        self.api_token = api_token
        self.account_id = account_id
        self.base_url = "https://api.cloudflare.com/client/v4"
        
        logger.info("Initialized CloudflareService")

    async def _call_api(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Helper to call Cloudflare API"""
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
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
                elif method.upper() == "DELETE":
                    response = await client.delete(url, headers=headers, timeout=30)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                response.raise_for_status()
                
                # Cloudflare returns JSON responses
                response_data = response.json()
                
                if response_data.get("success", False):
                    return {"success": True, "data": response_data.get("result", response_data)}
                else:
                    return {
                        "success": False, 
                        "message": response_data.get("errors", [{"message": "Unknown error"}])[0].get("message", "API call failed")
                    }
                
        except httpx.RequestError as exc:
            logger.error(f"Cloudflare API request error for {method} {endpoint}: {exc}")
            raise Exception(f"Cloudflare API request failed: {exc}")
        except httpx.HTTPStatusError as exc:
            logger.error(f"Cloudflare API HTTP error for {method} {endpoint}: {exc.response.status_code} - {exc.response.text}")
            raise Exception(f"Cloudflare API HTTP error: {exc.response.status_code} - {exc.response.text}")
        except Exception as exc:
            logger.error(f"Unexpected error calling Cloudflare API {method} {endpoint}: {exc}")
            raise Exception(f"Unexpected error: {exc}")

    async def test_connection(self) -> Dict[str, Any]:
        """Test API connection"""
        try:
            result = await self._call_api("GET", "/user/tokens/verify")
            return result
        except Exception as e:
            return {"success": False, "message": f"Connection test failed: {str(e)}"}

    async def check_domain_availability(self, domain_name: str) -> Dict[str, Any]:
        """Check if a domain is available for registration"""
        try:
            # Cloudflare doesn't have a direct availability check API
            # We can check if the domain is already in the account
            result = await self._call_api("GET", f"/zones?name={domain_name}")
            
            if result.get("success") and result.get("data"):
                # Domain exists in account
                return {"success": True, "available": False, "message": "Domain already in account"}
            else:
                # Domain not in account (might be available)
                return {"success": True, "available": True, "message": "Domain not in account"}
        except Exception as e:
            return {"success": False, "message": f"Domain availability check failed: {str(e)}"}

    async def get_domain_pricing(self, domain_name: str) -> Dict[str, Any]:
        """Get domain pricing information"""
        try:
            # Cloudflare doesn't expose pricing via API
            return {"success": False, "message": "Pricing information not available via API"}
        except Exception as e:
            return {"success": False, "message": f"Domain pricing check failed: {str(e)}"}

    async def register_domain(self, domain_name: str, years: int, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a domain (Cloudflare Registrar)"""
        registration_data = {
            "domain": domain_name,
            "years": years,
            "privacy": customer_data.get("privacy", True),
            "auto_renew": customer_data.get("auto_renew", True)
        }
        
        try:
            result = await self._call_api("POST", f"/accounts/{self.account_id}/registrar/domains", registration_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain registration failed: {str(e)}"}

    async def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Get detailed information about a domain"""
        try:
            result = await self._call_api("GET", f"/zones?name={domain_name}")
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain info retrieval failed: {str(e)}"}

    async def set_nameservers(self, domain_name: str, nameservers: List[str]) -> Dict[str, Any]:
        """Set custom nameservers for a domain"""
        # First get the zone ID
        zone_result = await self._call_api("GET", f"/zones?name={domain_name}")
        if not zone_result.get("success") or not zone_result.get("data"):
            return {"success": False, "message": "Domain not found in account"}
        
        zone_id = zone_result["data"][0]["id"]
        
        # Update nameservers
        nameserver_data = {"nameservers": nameservers}
        
        try:
            result = await self._call_api("PATCH", f"/zones/{zone_id}", nameserver_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Nameserver update failed: {str(e)}"}

    async def get_nameservers(self, domain_name: str) -> Dict[str, Any]:
        """Get current nameservers for a domain"""
        try:
            result = await self._call_api("GET", f"/zones?name={domain_name}")
            if result.get("success") and result.get("data"):
                zone_id = result["data"][0]["id"]
                nameservers_result = await self._call_api("GET", f"/zones/{zone_id}")
                return nameservers_result
            else:
                return {"success": False, "message": "Domain not found"}
        except Exception as e:
            return {"success": False, "message": f"Nameserver retrieval failed: {str(e)}"}

    async def renew_domain(self, domain_name: str, years: int) -> Dict[str, Any]:
        """Renew a domain"""
        renewal_data = {
            "years": years,
            "auto_renew": True
        }
        
        try:
            result = await self._call_api("POST", f"/accounts/{self.account_id}/registrar/domains/{domain_name}/renew", renewal_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain renewal failed: {str(e)}"}

    async def transfer_domain(self, domain_name: str, auth_code: str, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transfer a domain"""
        transfer_data = {
            "auth_code": auth_code,
            "privacy": customer_data.get("privacy", True),
            "auto_renew": customer_data.get("auto_renew", True)
        }
        
        try:
            result = await self._call_api("POST", f"/accounts/{self.account_id}/registrar/domains/{domain_name}/transfer", transfer_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"Domain transfer failed: {str(e)}"}

    async def get_dns_records(self, domain_name: str) -> Dict[str, Any]:
        """Get DNS records for a domain"""
        try:
            # First get the zone ID
            zone_result = await self._call_api("GET", f"/zones?name={domain_name}")
            if not zone_result.get("success") or not zone_result.get("data"):
                return {"success": False, "message": "Domain not found in account"}
            
            zone_id = zone_result["data"][0]["id"]
            
            # Get DNS records
            result = await self._call_api("GET", f"/zones/{zone_id}/dns_records")
            return result
        except Exception as e:
            return {"success": False, "message": f"DNS records retrieval failed: {str(e)}"}

    async def create_dns_record(self, domain_name: str, record_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a DNS record for a domain"""
        try:
            # First get the zone ID
            zone_result = await self._call_api("GET", f"/zones?name={domain_name}")
            if not zone_result.get("success") or not zone_result.get("data"):
                return {"success": False, "message": "Domain not found in account"}
            
            zone_id = zone_result["data"][0]["id"]
            
            # Create DNS record
            result = await self._call_api("POST", f"/zones/{zone_id}/dns_records", record_data)
            return result
        except Exception as e:
            return {"success": False, "message": f"DNS record creation failed: {str(e)}"}
