"""
NextPanel Multi-Server Integration Service
Manages multiple NextPanel servers and provisions accounts via API keys
"""

import requests
from typing import Optional, Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NextPanelServer:
    """Represents a single NextPanel server with API credentials"""
    
    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: str,
        api_secret: str,
        is_active: bool = True,
        capacity: int = 100,
        current_accounts: int = 0
    ):
        self.name = name
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.api_secret = api_secret
        self.is_active = is_active
        self.capacity = capacity
        self.current_accounts = current_accounts
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': self.api_key,
            'X-API-Secret': self.api_secret,
            'Content-Type': 'application/json'
        })
    
    def is_available(self) -> bool:
        """Check if server has capacity for new accounts"""
        return self.is_active and self.current_accounts < self.capacity
    
    def test_connection(self) -> bool:
        """Test connection to NextPanel server"""
        try:
            response = self.session.get(f'{self.base_url}/api/health', timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Connection test failed for {self.name}: {e}")
            return False


class NextPanelService:
    """
    Service to manage multiple NextPanel servers
    Automatically distributes accounts across servers based on capacity
    """
    
    def __init__(self):
        self.servers: Dict[str, NextPanelServer] = {}
        self._db_loaded = False
        # Note: Can't load from DB here since __init__ is sync and DB queries are async
        # Will load on first use instead
    
    def _load_servers(self):
        """
        Load NextPanel servers from configuration
        In production, load this from database
        """
        # Note: This is called from __init__ which is sync
        # Database loading happens via load_servers_from_db() which is called from the API
        pass
    
    async def load_servers_from_db(self, db):
        """
        Load all active servers from database
        This should be called when the service starts or when checking server availability
        """
        from app.models.nextpanel_server import NextPanelServer as NextPanelServerModel
        from sqlalchemy import select
        
        if self._db_loaded:
            return  # Already loaded
            
        try:
            result = await db.execute(
                select(NextPanelServerModel).where(NextPanelServerModel.is_active == True)
            )
            db_servers = result.scalars().all()
            
            for db_server in db_servers:
                # Add each server to the service
                server = NextPanelServer(
                    name=db_server.name,
                    base_url=db_server.base_url,
                    api_key=db_server.api_key,
                    api_secret=db_server.api_secret,
                    is_active=db_server.is_active,
                    capacity=db_server.capacity,
                    current_accounts=db_server.current_accounts
                )
                self.servers[str(db_server.id)] = server
                logger.info(f"Loaded server from DB: {db_server.name} (ID: {db_server.id})")
            
            self._db_loaded = True
            logger.info(f"Successfully loaded {len(db_servers)} servers from database")
            
        except Exception as e:
            logger.error(f"Failed to load servers from database: {e}")
    
    def reload_servers(self):
        """Force reload of servers on next DB access"""
        self._db_loaded = False
    
    def add_server(
        self,
        server_id: str,
        name: str,
        base_url: str,
        api_key: str,
        api_secret: str,
        capacity: int = 100
    ) -> bool:
        """Add a new NextPanel server to the pool"""
        try:
            server = NextPanelServer(
                name=name,
                base_url=base_url,
                api_key=api_key,
                api_secret=api_secret,
                capacity=capacity
            )
            
            # Test connection
            if not server.test_connection():
                logger.error(f"Cannot add server {name}: connection test failed")
                return False
            
            self.servers[server_id] = server
            logger.info(f"Added NextPanel server: {name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add server: {e}")
            return False
    
    def remove_server(self, server_id: str):
        """Remove a server from the pool"""
        if server_id in self.servers:
            del self.servers[server_id]
            logger.info(f"Removed server: {server_id}")
    
    def get_available_server(self) -> Optional[NextPanelServer]:
        """Get the best available server for provisioning (least loaded)"""
        available_servers = [
            server for server in self.servers.values()
            if server.is_available()
        ]
        
        if not available_servers:
            logger.error("No available servers found")
            return None
        
        # Return server with most available capacity
        return min(available_servers, key=lambda s: s.current_accounts)
    
    def create_account(
        self,
        username: str,
        email: str,
        password: str,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        company: Optional[str] = None,
        package_id: Optional[str] = None,
        billing_customer_id: Optional[str] = None,
        server_id: Optional[str] = None,
        is_admin: bool = False,  # Set to True to create reseller accounts
        account_type: Optional[str] = None  # 'panel', 'reseller', 'master-reseller'
    ) -> Dict[str, Any]:
        """
        Create a hosting account on a NextPanel server
        
        Args:
            username: Account username
            email: Account email
            password: Account password
            full_name: Full name
            phone: Phone number
            company: Company name
            package_id: Package/plan ID
            billing_customer_id: Customer ID from billing system
            server_id: Specific server ID (optional, auto-select if None)
        
        Returns:
            Dict with account details and server info
        """
        try:
            # Select server
            if server_id:
                server = self.servers.get(server_id)
                if not server or not server.is_available():
                    raise Exception(f"Server {server_id} not available")
            else:
                server = self.get_available_server()
                if not server:
                    raise Exception("No available servers")
            
            # Create account via API
            data = {
                "username": username,
                "email": email,
                "password": password,
                "full_name": full_name,
                "phone": phone,
                "company": company,
                "package_id": package_id,
                "is_admin": is_admin,  # Create as reseller if True
                "billing_id": billing_customer_id,
                "metadata": {
                    "created_from": "billing_system",
                    "billing_customer_id": billing_customer_id,
                    "account_type": account_type or ("reseller" if is_admin else "panel"),
                    "is_admin": is_admin,
                    "account_level": account_type,  # Keep track of the specific level
                    "created_at": datetime.utcnow().isoformat()
                }
            }
            
            logger.info(f"Attempting to create account on {server.base_url}/api/v1/billing/accounts")
            logger.info(f"Using API Key: {server.api_key[:15]}...")
            logger.info(f"Request data: {data}")
            
            response = server.session.post(
                f'{server.base_url}/api/v1/billing/accounts',
                json=data,
                timeout=30
            )
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response body: {response.text}")
            
            if response.status_code == 201:
                account = response.json()
                server.current_accounts += 1
                
                logger.info(
                    f"Created account {username} on server {server.name} "
                    f"(user_id: {account['id']})"
                )
                
                return {
                    "success": True,
                    "account": account,
                    "server_name": server.name,
                    "server_url": server.base_url,
                    "nextpanel_user_id": account['id']
                }
            else:
                try:
                    error_detail = response.json().get('detail', response.text)
                except:
                    error_detail = response.text
                logger.error(f"Account creation failed: {error_detail}")
                raise Exception(f"Failed to create account: {error_detail}")
                
        except Exception as e:
            logger.error(f"Failed to create account: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_account(self, server_id: str, user_id: int) -> Optional[Dict]:
        """Get account details from specific server"""
        try:
            server = self.servers.get(server_id)
            if not server:
                logger.error(f"Server {server_id} not found")
                return None
            
            response = server.session.get(
                f'{server.base_url}/api/v1/billing/accounts/{user_id}',
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get account: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to get account: {e}")
            return None
    
    def suspend_account(
        self,
        server_id: str,
        user_id: int,
        reason: Optional[str] = None
    ) -> bool:
        """Suspend an account on a specific server"""
        try:
            server = self.servers.get(server_id)
            if not server:
                logger.error(f"Server {server_id} not found")
                return False
            
            data = {"reason": reason or "Suspended by billing system"}
            
            response = server.session.post(
                f'{server.base_url}/api/v1/billing/accounts/{user_id}/suspend',
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Suspended account {user_id} on {server.name}")
                return True
            else:
                logger.error(f"Failed to suspend: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to suspend account: {e}")
            return False
    
    def unsuspend_account(self, server_id: str, user_id: int) -> bool:
        """Unsuspend an account on a specific server"""
        try:
            server = self.servers.get(server_id)
            if not server:
                logger.error(f"Server {server_id} not found")
                return False
            
            response = server.session.post(
                f'{server.base_url}/api/v1/billing/accounts/{user_id}/unsuspend',
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Unsuspended account {user_id} on {server.name}")
                return True
            else:
                logger.error(f"Failed to unsuspend: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to unsuspend account: {e}")
            return False
    
    def delete_account(self, server_id: str, user_id: int) -> bool:
        """Delete an account from a specific server"""
        try:
            server = self.servers.get(server_id)
            if not server:
                logger.error(f"Server {server_id} not found")
                return False
            
            response = server.session.delete(
                f'{server.base_url}/api/v1/billing/accounts/{user_id}',
                timeout=10
            )
            
            if response.status_code == 200:
                server.current_accounts -= 1
                logger.info(f"Deleted account {user_id} from {server.name}")
                return True
            else:
                logger.error(f"Failed to delete: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete account: {e}")
            return False
    
    def get_account_stats(self, server_id: str, user_id: int) -> Optional[Dict]:
        """Get resource usage statistics for an account"""
        try:
            server = self.servers.get(server_id)
            if not server:
                logger.error(f"Server {server_id} not found")
                return None
            
            response = server.session.get(
                f'{server.base_url}/api/v1/billing/accounts/{user_id}/stats',
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get stats: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return None
    
    def get_all_servers_status(self) -> List[Dict]:
        """Get status of all servers"""
        statuses = []
        
        for server_id, server in self.servers.items():
            try:
                is_online = server.test_connection()
                
                statuses.append({
                    "server_id": server_id,
                    "name": server.name,
                    "url": server.base_url,
                    "is_active": server.is_active,
                    "is_online": is_online,
                    "current_accounts": server.current_accounts,
                    "capacity": server.capacity,
                    "utilization": (server.current_accounts / server.capacity * 100)
                                   if server.capacity > 0 else 0
                })
            except Exception as e:
                logger.error(f"Failed to get status for {server.name}: {e}")
                statuses.append({
                    "server_id": server_id,
                    "name": server.name,
                    "url": server.base_url,
                    "is_active": False,
                    "is_online": False,
                    "error": str(e)
                })
        
        return statuses


# Singleton instance
_nextpanel_service = None

def get_nextpanel_service() -> NextPanelService:
    """Get or create NextPanelService singleton"""
    global _nextpanel_service
    if _nextpanel_service is None:
        _nextpanel_service = NextPanelService()
    return _nextpanel_service

