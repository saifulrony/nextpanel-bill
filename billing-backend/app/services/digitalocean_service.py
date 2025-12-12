"""
DigitalOcean API Service for VPS Provisioning
Handles automated VPS (droplet) creation and management
"""

import requests
import os
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class DigitalOceanService:
    """Service for managing DigitalOcean droplets (VPS)"""
    
    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or os.getenv("DIGITALOCEAN_API_TOKEN")
        if not self.api_token:
            raise ValueError("DigitalOcean API token is required")
        self.base_url = "https://api.digitalocean.com/v2"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
    
    def create_droplet(
        self,
        name: str,
        region: str = "nyc1",
        size: str = "s-2vcpu-4gb",
        image: str = "ubuntu-22-04-x64",
        ssh_keys: Optional[List[str]] = None,
        backups: bool = False,
        monitoring: bool = True,
        tags: Optional[List[str]] = None
    ) -> Dict:
        """
        Create a new droplet (VPS) on DigitalOcean
        
        Args:
            name: Unique name for the droplet
            region: Region slug (e.g., 'nyc1', 'sgp1', 'lon1')
            size: Droplet size slug (e.g., 's-2vcpu-4gb', 's-4vcpu-8gb')
            image: Image slug or ID (e.g., 'ubuntu-22-04-x64')
            ssh_keys: List of SSH key IDs or fingerprints
            backups: Enable automatic backups
            monitoring: Enable monitoring
            tags: List of tags to apply
        
        Returns:
            Dict with droplet information including ID and status
        """
        url = f"{self.base_url}/droplets"
        
        data = {
            "name": name,
            "region": region,
            "size": size,
            "image": image,
            "backups": backups,
            "monitoring": monitoring,
        }
        
        if ssh_keys:
            data["ssh_keys"] = ssh_keys
        
        if tags:
            data["tags"] = tags
        
        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"Created droplet: {name} (ID: {result['droplet']['id']})")
            return {
                "success": True,
                "droplet_id": result["droplet"]["id"],
                "name": result["droplet"]["name"],
                "status": result["droplet"]["status"],
                "region": result["droplet"]["region"]["slug"],
                "size": result["droplet"]["size"]["slug"],
                "image": result["droplet"]["image"]["slug"],
                "ip_address": None,  # Will be available after provisioning
                "created_at": result["droplet"]["created_at"]
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create droplet: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_droplet(self, droplet_id: int) -> Dict:
        """Get droplet information by ID"""
        url = f"{self.base_url}/droplets/{droplet_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            droplet = response.json()["droplet"]
            
            # Extract IP address
            ip_address = None
            for network in droplet.get("networks", {}).get("v4", []):
                if network["type"] == "public":
                    ip_address = network["ip_address"]
                    break
            
            return {
                "success": True,
                "droplet_id": droplet["id"],
                "name": droplet["name"],
                "status": droplet["status"],
                "ip_address": ip_address,
                "region": droplet["region"]["slug"],
                "size": droplet["size"]["slug"],
                "image": droplet["image"]["slug"],
                "created_at": droplet["created_at"]
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get droplet {droplet_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def delete_droplet(self, droplet_id: int) -> Dict:
        """Delete a droplet"""
        url = f"{self.base_url}/droplets/{droplet_id}"
        
        try:
            response = requests.delete(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            logger.info(f"Deleted droplet: {droplet_id}")
            return {"success": True}
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to delete droplet {droplet_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def reboot_droplet(self, droplet_id: int) -> Dict:
        """Reboot a droplet"""
        url = f"{self.base_url}/droplets/{droplet_id}/actions"
        data = {"type": "reboot"}
        
        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=30)
            response.raise_for_status()
            logger.info(f"Rebooted droplet: {droplet_id}")
            return {"success": True}
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to reboot droplet {droplet_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def power_off_droplet(self, droplet_id: int) -> Dict:
        """Power off a droplet"""
        url = f"{self.base_url}/droplets/{droplet_id}/actions"
        data = {"type": "power_off"}
        
        try:
            response = requests.post(url, json=data, headers=self.headers, timeout=30)
            response.raise_for_status()
            logger.info(f"Powered off droplet: {droplet_id}")
            return {"success": True}
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to power off droplet {droplet_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_available_regions(self) -> List[Dict]:
        """Get list of available regions"""
        url = f"{self.base_url}/regions"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            regions = response.json()["regions"]
            return [
                {
                    "slug": r["slug"],
                    "name": r["name"],
                    "available": r["available"]
                }
                for r in regions
                if r["available"]
            ]
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get regions: {e}")
            return []
    
    def get_available_sizes(self) -> List[Dict]:
        """Get list of available droplet sizes"""
        url = f"{self.base_url}/sizes"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            sizes = response.json()["sizes"]
            return [
                {
                    "slug": s["slug"],
                    "memory": s["memory"],
                    "vcpus": s["vcpus"],
                    "disk": s["disk"],
                    "price_monthly": s["price_monthly"]
                }
                for s in sizes
                if s["available"]
            ]
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get sizes: {e}")
            return []
    
    def map_product_to_specs(self, product_features: Dict) -> Dict:
        """
        Map your product features to DigitalOcean specs
        
        Example:
        {
            "cpu": "2 vCPU",
            "ram": "4 GB",
            "storage": "80 GB SSD"
        }
        ->
        {
            "size": "s-2vcpu-4gb",
            "region": "nyc1",
            "image": "ubuntu-22-04-x64"
        }
        """
        # Extract CPU and RAM from product features
        cpu = int(product_features.get("cpu", "2").split()[0])
        ram_gb = int(product_features.get("ram", "4").split()[0])
        
        # Map to DigitalOcean size slug
        size_mapping = {
            (1, 1): "s-1vcpu-1gb",
            (1, 2): "s-1vcpu-2gb",
            (2, 4): "s-2vcpu-4gb",
            (4, 8): "s-4vcpu-8gb",
            (8, 16): "s-8vcpu-16gb",
            (16, 32): "s-16vcpu-32gb",
        }
        
        size = size_mapping.get((cpu, ram_gb), "s-2vcpu-4gb")
        
        return {
            "size": size,
            "region": product_features.get("region", "nyc1"),
            "image": product_features.get("image", "ubuntu-22-04-x64"),
            "backups": product_features.get("backups", False),
            "monitoring": product_features.get("monitoring", True)
        }

