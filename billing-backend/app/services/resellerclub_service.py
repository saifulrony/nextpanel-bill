"""
ResellerClub API Service
"""
import httpx
import logging
from typing import Dict, Any, Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class ResellerClubService:
    """
    Service for interacting with the ResellerClub API.
    Documentation: https://manage.resellerclub.com/kb/answer/744
    """
    
    def __init__(self, reseller_id: str, api_key: str, sandbox: bool = True):
        self.reseller_id = reseller_id
        self.api_key = api_key
        self.base_url = "https://test.httpapi.com/api" if sandbox else "https://httpapi.com/api"
        self.sandbox = sandbox
        
        logger.info(f"Initialized ResellerClubService (Sandbox: {sandbox})")

    async def _call_api(self, command: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Helper to call ResellerClub API"""
        full_params = {
            "auth-userid": self.reseller_id,
            "api-key": self.api_key,
            "command": command,
            **params
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=full_params, timeout=30)
                response.raise_for_status()
                
                # ResellerClub returns plain text responses
                response_text = response.text.strip()
                
                # Parse response based on format
                if response_text.startswith("ERROR"):
                    return {"success": False, "message": response_text}
                elif response_text.startswith("SUCCESS"):
                    return {"success": True, "message": response_text}
                else:
                    # Try to parse as JSON if possible
                    try:
                        import json
                        data = json.loads(response_text)
                        return {"success": True, "data": data}
                    except:
                        return {"success": True, "message": response_text}
                
        except httpx.RequestError as exc:
            logger.error(f"ResellerClub API request error for {command}: {exc}")
            raise Exception(f"ResellerClub API request failed: {exc}")
        except httpx.HTTPStatusError as exc:
            logger.error(f"ResellerClub API HTTP error for {command}: {exc.response.status_code} - {exc.response.text}")
            raise Exception(f"ResellerClub API HTTP error: {exc.response.status_code} - {exc.response.text}")
        except Exception as exc:
            logger.error(f"Unexpected error calling ResellerClub API {command}: {exc}")
            raise Exception(f"Unexpected error: {exc}")

    async def test_connection(self) -> Dict[str, Any]:
        """Test API connection"""
        try:
            result = await self._call_api("domains", {"action": "list"})
            return result
        except Exception as e:
            return {"success": False, "message": f"Connection test failed: {str(e)}"}

    async def check_domain_availability(self, domain_name: str) -> Dict[str, Any]:
        """Check if a domain is available for registration"""
        command = "domains"
        params = {
            "action": "available",
            "domain-name": domain_name
        }
        return await self._call_api(command, params)

    async def get_domain_pricing(self, domain_name: str) -> Dict[str, Any]:
        """Get domain pricing information"""
        tld = domain_name.split('.')[-1]
        command = "domains"
        params = {
            "action": "pricing",
            "tld": tld
        }
        return await self._call_api(command, params)

    async def register_domain(self, domain_name: str, years: int, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a domain"""
        command = "domains"
        params = {
            "action": "register",
            "domain-name": domain_name,
            "years": years,
            "ns": customer_data.get("nameservers", ["ns1.example.com", "ns2.example.com"]),
            "customer-id": customer_data.get("customer_id", "1"),
            "reg-contact-id": customer_data.get("registrant_contact_id", "1"),
            "admin-contact-id": customer_data.get("admin_contact_id", "1"),
            "tech-contact-id": customer_data.get("tech_contact_id", "1"),
            "billing-contact-id": customer_data.get("billing_contact_id", "1"),
            "invoice-option": "NoInvoice",
            "purchase-privacy": "false"
        }
        return await self._call_api(command, params)

    async def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Get detailed information about a domain"""
        command = "domains"
        params = {
            "action": "details",
            "domain-name": domain_name
        }
        return await self._call_api(command, params)

    async def set_nameservers(self, domain_name: str, nameservers: List[str]) -> Dict[str, Any]:
        """Set custom nameservers for a domain"""
        command = "domains"
        params = {
            "action": "modify-ns",
            "domain-name": domain_name,
            "ns": nameservers
        }
        return await self._call_api(command, params)

    async def get_nameservers(self, domain_name: str) -> Dict[str, Any]:
        """Get current nameservers for a domain"""
        command = "domains"
        params = {
            "action": "get-ns",
            "domain-name": domain_name
        }
        return await self._call_api(command, params)

    async def renew_domain(self, domain_name: str, years: int) -> Dict[str, Any]:
        """Renew a domain"""
        command = "domains"
        params = {
            "action": "renew",
            "domain-name": domain_name,
            "years": years
        }
        return await self._call_api(command, params)

    async def transfer_domain(self, domain_name: str, auth_code: str, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transfer a domain"""
        command = "domains"
        params = {
            "action": "transfer",
            "domain-name": domain_name,
            "auth-code": auth_code,
            "customer-id": customer_data.get("customer_id", "1"),
            "reg-contact-id": customer_data.get("registrant_contact_id", "1"),
            "admin-contact-id": customer_data.get("admin_contact_id", "1"),
            "tech-contact-id": customer_data.get("tech_contact_id", "1"),
            "billing-contact-id": customer_data.get("billing_contact_id", "1")
        }
        return await self._call_api(command, params)
