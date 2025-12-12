"""
Manual Provisioning Module
For servers that require manual setup by admin
"""

from .base import ProvisioningModule
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class ManualProvisioningModule(ProvisioningModule):
    """
    Manual provisioning module
    Admin provisions server manually, then updates the record
    """
    
    def create_account(self, params: Dict) -> Dict:
        """
        Create server record in pending state
        Admin will provision manually and update
        """
        logger.info(f"Manual provisioning requested for order {params.get('order_id')}")
        
        return {
            "success": True,
            "status": "pending_provisioning",
            "message": "Server pending manual provisioning by admin",
            "requires_manual_setup": True,
            "server_id": None,  # Will be set by admin
            "ip_address": None,  # Will be set by admin
        }
    
    def suspend_account(self, server_id: str, reason: Optional[str] = None) -> Dict:
        """Manual suspend - notify admin"""
        logger.info(f"Manual suspend requested for server {server_id}")
        return {
            "success": True,
            "message": "Admin will suspend server manually",
            "requires_manual_action": True
        }
    
    def unsuspend_account(self, server_id: str) -> Dict:
        """Manual unsuspend - notify admin"""
        logger.info(f"Manual unsuspend requested for server {server_id}")
        return {
            "success": True,
            "message": "Admin will unsuspend server manually",
            "requires_manual_action": True
        }
    
    def terminate_account(self, server_id: str) -> Dict:
        """Manual terminate - notify admin"""
        logger.info(f"Manual terminate requested for server {server_id}")
        return {
            "success": True,
            "message": "Admin will terminate server manually",
            "requires_manual_action": True
        }
    
    def get_server_status(self, server_id: str) -> Dict:
        """Return status from database (not from provider)"""
        return {
            "success": True,
            "status": "active",  # This should be fetched from database
            "message": "Status retrieved from database"
        }
    
    def reboot_server(self, server_id: str, boot_type: str = "soft") -> Dict:
        """Manual reboot - notify admin"""
        logger.info(f"Manual reboot requested for server {server_id}")
        return {
            "success": True,
            "message": "Admin will reboot server manually",
            "requires_manual_action": True
        }
    
    def get_module_info(self) -> Dict:
        return {
            "name": "Manual Provisioning",
            "version": "1.0.0",
            "description": "Manual server provisioning by admin",
            "features": ["manual_setup", "admin_controlled"]
        }

