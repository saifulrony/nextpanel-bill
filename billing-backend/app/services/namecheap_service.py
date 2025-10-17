"""
Namecheap API Integration Service
"""
import httpx
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional
import logging
from urllib.parse import urlencode
import hashlib
import time

logger = logging.getLogger(__name__)

class NamecheapService:
    """Service for Namecheap API integration"""
    
    def __init__(self, api_user: str, api_key: str, username: str, 
                 client_ip: str, sandbox: bool = True):
        self.api_user = api_user
        self.api_key = api_key
        self.username = username
        self.client_ip = client_ip
        self.sandbox = sandbox
        
        # API endpoints
        if sandbox:
            self.base_url = "https://api.sandbox.namecheap.com/xml.response"
        else:
            self.base_url = "https://api.namecheap.com/xml.response"
    
    def _make_request(self, command: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """Make API request to Namecheap"""
        if params is None:
            params = {}
        
        # Add common parameters
        params.update({
            'ApiUser': self.api_user,
            'ApiKey': self.api_key,
            'UserName': self.username,
            'Command': command,
            'ClientIp': self.client_ip,
        })
        
        try:
            with httpx.Client() as client:
                logger.info(f"Making Namecheap API request to: {self.base_url}")
                logger.info(f"Command: {command}, Params: {params}")
                
                response = client.get(self.base_url, params=params)
                logger.info(f"Namecheap API response status: {response.status_code}")
                logger.info(f"Namecheap API response text: {response.text[:500]}...")
                
                response.raise_for_status()
                
                # Parse XML response
                try:
                    root = ET.fromstring(response.text)
                except ET.ParseError as e:
                    logger.error(f"Failed to parse XML response: {e}")
                    logger.error(f"Raw response: {response.text}")
                    raise Exception(f"Invalid XML response from Namecheap API: {e}")
                
                # Check for errors
                if root.get('Status') == 'ERROR':
                    error_elements = root.findall('Errors/Error')
                    if error_elements:
                        error_messages = [error.text for error in error_elements if error.text]
                        error_msg = '; '.join(error_messages) if error_messages else 'Unknown error'
                    else:
                        # Check for common error patterns in the response
                        full_text = response.text
                        if 'Invalid API User' in full_text:
                            error_msg = 'Invalid API User - check your API Username'
                        elif 'Invalid API Key' in full_text:
                            error_msg = 'Invalid API Key - check your API Key'
                        elif 'Invalid Client IP' in full_text:
                            error_msg = 'Invalid Client IP - your IP may not be whitelisted'
                        elif 'Authentication failed' in full_text:
                            error_msg = 'Authentication failed - check your credentials'
                        elif 'Access denied' in full_text:
                            error_msg = 'Access denied - check your API permissions'
                        else:
                            error_msg = f'Unknown error - full response: {full_text}'
                    
                    logger.error(f"Namecheap API error: {error_msg}")
                    logger.error(f"Full response: {response.text}")
                    raise Exception(f"Namecheap API Error: {error_msg}")
                
                return self._parse_response(root)
                
        except httpx.RequestError as e:
            logger.error(f"Namecheap API request failed: {str(e)}")
            raise Exception(f"Namecheap API request failed: {str(e)}")
        except Exception as e:
            logger.error(f"Namecheap API error: {str(e)}")
            raise
    
    def _parse_response(self, root: ET.Element) -> Dict[str, Any]:
        """Parse XML response into dictionary"""
        result = {
            'status': root.get('Status'),
            'command': root.get('Command'),
            'data': {}
        }
        
        # Parse command response
        command_response = root.find('CommandResponse')
        if command_response is not None:
            result['data'] = self._xml_to_dict(command_response)
        
        return result
    
    def _xml_to_dict(self, element: ET.Element) -> Dict[str, Any]:
        """Convert XML element to dictionary"""
        result = {}
        
        for child in element:
            if len(child) == 0:
                result[child.tag] = child.text
            else:
                if child.tag not in result:
                    result[child.tag] = []
                result[child.tag].append(self._xml_to_dict(child))
        
        return result
    
    async def check_domain_availability(self, domain_names: List[str]) -> Dict[str, bool]:
        """Check domain availability"""
        try:
            params = {
                'DomainList': ','.join(domain_names)
            }
            
            response = self._make_request('namecheap.domains.check', params)
            
            # Parse availability results
            availability = {}
            if 'DomainCheckResult' in response['data']:
                domains = response['data']['DomainCheckResult']
                if not isinstance(domains, list):
                    domains = [domains]
                
                for domain in domains:
                    domain_name = domain.get('Domain', '')
                    is_available = domain.get('Available', 'false').lower() == 'true'
                    availability[domain_name] = is_available
            
            return availability
            
        except Exception as e:
            logger.error(f"Failed to check domain availability: {str(e)}")
            raise
    
    async def get_domain_pricing(self, domain_name: str) -> Dict[str, Any]:
        """Get domain pricing information"""
        try:
            tld = domain_name.split('.')[-1]
            
            params = {
                'ProductType': 'DOMAIN',
                'ActionName': 'REGISTER',
                'ProductName': tld
            }
            
            response = self._make_request('namecheap.users.getPricing', params)
            
            # Parse pricing data
            pricing = {
                'domain': domain_name,
                'tld': tld,
                'register_price': 0.0,
                'renew_price': 0.0,
                'transfer_price': 0.0,
                'restore_price': 0.0
            }
            
            if 'ProductPricing' in response['data']:
                product_pricing = response['data']['ProductPricing']
                if isinstance(product_pricing, list):
                    for price_info in product_pricing:
                        duration = price_info.get('Duration', '')
                        price = float(price_info.get('Price', 0))
                        
                        if duration == '1':
                            pricing['register_price'] = price
                        elif duration == '2':
                            pricing['renew_price'] = price
                        elif duration == '3':
                            pricing['transfer_price'] = price
                        elif duration == '4':
                            pricing['restore_price'] = price
            
            return pricing
            
        except Exception as e:
            logger.error(f"Failed to get domain pricing: {str(e)}")
            raise
    
    async def register_domain(self, domain_name: str, years: int = 1, 
                            registrant_info: Dict[str, str] = None) -> Dict[str, Any]:
        """Register a domain"""
        try:
            if registrant_info is None:
                registrant_info = {}
            
            params = {
                'DomainName': domain_name,
                'Years': years,
                'RegistrantFirstName': registrant_info.get('first_name', ''),
                'RegistrantLastName': registrant_info.get('last_name', ''),
                'RegistrantAddress1': registrant_info.get('address1', ''),
                'RegistrantCity': registrant_info.get('city', ''),
                'RegistrantStateProvince': registrant_info.get('state', ''),
                'RegistrantPostalCode': registrant_info.get('postal_code', ''),
                'RegistrantCountry': registrant_info.get('country', 'US'),
                'RegistrantPhone': registrant_info.get('phone', ''),
                'RegistrantEmailAddress': registrant_info.get('email', ''),
                'TechFirstName': registrant_info.get('tech_first_name', registrant_info.get('first_name', '')),
                'TechLastName': registrant_info.get('tech_last_name', registrant_info.get('last_name', '')),
                'TechAddress1': registrant_info.get('tech_address1', registrant_info.get('address1', '')),
                'TechCity': registrant_info.get('tech_city', registrant_info.get('city', '')),
                'TechStateProvince': registrant_info.get('tech_state', registrant_info.get('state', '')),
                'TechPostalCode': registrant_info.get('tech_postal_code', registrant_info.get('postal_code', '')),
                'TechCountry': registrant_info.get('tech_country', registrant_info.get('country', 'US')),
                'TechPhone': registrant_info.get('tech_phone', registrant_info.get('phone', '')),
                'TechEmailAddress': registrant_info.get('tech_email', registrant_info.get('email', '')),
                'AdminFirstName': registrant_info.get('admin_first_name', registrant_info.get('first_name', '')),
                'AdminLastName': registrant_info.get('admin_last_name', registrant_info.get('last_name', '')),
                'AdminAddress1': registrant_info.get('admin_address1', registrant_info.get('address1', '')),
                'AdminCity': registrant_info.get('admin_city', registrant_info.get('city', '')),
                'AdminStateProvince': registrant_info.get('admin_state', registrant_info.get('state', '')),
                'AdminPostalCode': registrant_info.get('admin_postal_code', registrant_info.get('postal_code', '')),
                'AdminCountry': registrant_info.get('admin_country', registrant_info.get('country', 'US')),
                'AdminPhone': registrant_info.get('admin_phone', registrant_info.get('phone', '')),
                'AdminEmailAddress': registrant_info.get('admin_email', registrant_info.get('email', '')),
                'AuxBillingFirstName': registrant_info.get('billing_first_name', registrant_info.get('first_name', '')),
                'AuxBillingLastName': registrant_info.get('billing_last_name', registrant_info.get('last_name', '')),
                'AuxBillingAddress1': registrant_info.get('billing_address1', registrant_info.get('address1', '')),
                'AuxBillingCity': registrant_info.get('billing_city', registrant_info.get('city', '')),
                'AuxBillingStateProvince': registrant_info.get('billing_state', registrant_info.get('state', '')),
                'AuxBillingPostalCode': registrant_info.get('billing_postal_code', registrant_info.get('postal_code', '')),
                'AuxBillingCountry': registrant_info.get('billing_country', registrant_info.get('country', 'US')),
                'AuxBillingPhone': registrant_info.get('billing_phone', registrant_info.get('phone', '')),
                'AuxBillingEmailAddress': registrant_info.get('billing_email', registrant_info.get('email', '')),
            }
            
            response = self._make_request('namecheap.domains.create', params)
            
            return {
                'success': response['status'] == 'OK',
                'domain': domain_name,
                'order_id': response['data'].get('DomainCreateResult', {}).get('OrderID'),
                'transaction_id': response['data'].get('DomainCreateResult', {}).get('TransactionID'),
                'response': response
            }
            
        except Exception as e:
            logger.error(f"Failed to register domain {domain_name}: {str(e)}")
            raise
    
    async def get_domain_info(self, domain_name: str) -> Dict[str, Any]:
        """Get domain information"""
        try:
            params = {
                'DomainName': domain_name
            }
            
            response = self._make_request('namecheap.domains.getInfo', params)
            
            domain_info = response['data'].get('DomainGetInfoResult', {})
            
            return {
                'domain': domain_name,
                'status': domain_info.get('Status', ''),
                'created_date': domain_info.get('CreatedDate', ''),
                'expired_date': domain_info.get('ExpiredDate', ''),
                'auto_renew': domain_info.get('AutoRenew', 'false').lower() == 'true',
                'is_locked': domain_info.get('IsLocked', 'false').lower() == 'true',
                'nameservers': domain_info.get('Nameservers', {}).get('Nameserver', []),
                'whois_guard': domain_info.get('WhoisGuard', {}).get('Enabled', 'false').lower() == 'true'
            }
            
        except Exception as e:
            logger.error(f"Failed to get domain info for {domain_name}: {str(e)}")
            raise
    
    async def update_nameservers(self, domain_name: str, nameservers: List[str]) -> Dict[str, Any]:
        """Update domain nameservers"""
        try:
            if len(nameservers) < 2:
                raise ValueError("At least 2 nameservers required")
            
            params = {
                'DomainName': domain_name,
                'Nameservers': ','.join(nameservers)
            }
            
            response = self._make_request('namecheap.domains.dns.setCustom', params)
            
            return {
                'success': response['status'] == 'OK',
                'domain': domain_name,
                'nameservers': nameservers,
                'response': response
            }
            
        except Exception as e:
            logger.error(f"Failed to update nameservers for {domain_name}: {str(e)}")
            raise
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test API connection"""
        try:
            logger.info(f"Testing Namecheap connection with ApiUser: {self.api_user}, Username: {self.username}, ClientIp: {self.client_ip}")
            
            response = self._make_request('namecheap.users.getPricing', {
                'ProductType': 'DOMAIN',
                'ActionName': 'REGISTER',
                'ProductName': 'com'
            })
            
            logger.info(f"Namecheap test response: {response}")
            
            return {
                'success': response['status'] == 'OK',
                'message': 'Namecheap API connection successful',
                'response': response
            }
            
        except Exception as e:
            logger.error(f"Namecheap API connection test failed: {str(e)}")
            return {
                'success': False,
                'message': f'Connection failed: {str(e)}',
                'error': str(e)
            }
