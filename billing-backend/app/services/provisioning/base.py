"""
Base Provisioning Module Interface
Similar to WHMCS module structure - all provisioning modules must implement this interface
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional, List, Tuple


class ProvisioningModule(ABC):
    """
    Base class for all provisioning modules
    Similar to WHMCS module interface
    
    All modules must implement these methods to be compatible with the system
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize module with configuration
        
        Args:
            config: Module-specific configuration dictionary
        """
        self.config = config or {}
    
    @abstractmethod
    def create_account(self, params: Dict) -> Dict:
        """
        Create/provision a new dedicated server account
        Called when order is paid and server needs to be provisioned
        
        Args:
            params: Dictionary containing:
                - order_id: Order ID
                - customer_id: Customer ID
                - product_specs: Product specifications (cpu, ram, storage, etc.)
                - hostname: Server hostname
                - os: Operating system (e.g., 'ubuntu-22.04')
                - datacenter: Datacenter location
                - custom_fields: Any custom fields from order
        
        Returns:
            Dictionary with:
                - success: Boolean
                - server_id: Provider's server ID
                - ip_address: Server IP address
                - root_password: Root password (if generated)
                - status: Server status ('provisioning', 'active', etc.)
                - error: Error message if failed
                - meta_data: Additional metadata
        """
        pass
    
    @abstractmethod
    def suspend_account(self, server_id: str, reason: Optional[str] = None) -> Dict:
        """
        Suspend a server account
        Called when payment fails or admin suspends
        
        Args:
            server_id: Provider's server ID
            reason: Optional suspension reason
        
        Returns:
            Dictionary with success status and optional error message
        """
        pass
    
    @abstractmethod
    def unsuspend_account(self, server_id: str) -> Dict:
        """
        Unsuspend a server account
        Called when payment is received or admin unsuspends
        
        Args:
            server_id: Provider's server ID
        
        Returns:
            Dictionary with success status and optional error message
        """
        pass
    
    @abstractmethod
    def terminate_account(self, server_id: str) -> Dict:
        """
        Terminate/delete a server account
        Called when service is cancelled
        
        Args:
            server_id: Provider's server ID
        
        Returns:
            Dictionary with success status and optional error message
        """
        pass
    
    @abstractmethod
    def get_server_status(self, server_id: str) -> Dict:
        """
        Get current server status and details
        
        Args:
            server_id: Provider's server ID
        
        Returns:
            Dictionary with:
                - success: Boolean
                - status: Server status
                - ip_address: Server IP
                - specs: Server specifications
                - uptime: Server uptime (if available)
                - error: Error message if failed
        """
        pass
    
    @abstractmethod
    def reboot_server(self, server_id: str, boot_type: str = "soft") -> Dict:
        """
        Reboot a server
        
        Args:
            server_id: Provider's server ID
            boot_type: 'soft' or 'hard' reboot
        
        Returns:
            Dictionary with success status
        """
        pass
    
    def reinstall_os(self, server_id: str, os: str, preserve_data: bool = False) -> Dict:
        """
        Reinstall operating system on server
        Optional method - not all providers support this
        
        Args:
            server_id: Provider's server ID
            os: Operating system to install
            preserve_data: Whether to preserve data
        
        Returns:
            Dictionary with success status
        """
        return {
            "success": False,
            "error": "OS reinstallation not supported by this module"
        }
    
    def get_available_os(self) -> List[Dict]:
        """
        Get list of available operating systems
        Optional method
        
        Returns:
            List of OS dictionaries with name, id, etc.
        """
        return []
    
    def get_available_locations(self) -> List[Dict]:
        """
        Get list of available datacenter locations
        Optional method
        
        Returns:
            List of location dictionaries
        """
        return []
    
    def get_usage_stats(self, server_id: str) -> Dict:
        """
        Get server usage statistics (bandwidth, CPU, etc.)
        Optional method
        
        Args:
            server_id: Provider's server ID
        
        Returns:
            Dictionary with usage statistics
        """
        return {
            "success": False,
            "error": "Usage statistics not available"
        }
    
    def validate_config(self) -> Tuple[bool, Optional[str]]:
        """
        Validate module configuration
        Called before using module
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        return True, None
    
    def get_module_info(self) -> Dict:
        """
        Get module information (name, version, features)
        
        Returns:
            Dictionary with module metadata
        """
        return {
            "name": self.__class__.__name__,
            "version": "1.0.0",
            "features": []
        }

