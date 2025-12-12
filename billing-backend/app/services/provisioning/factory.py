"""
Provisioning Module Factory
Similar to WHMCS module system - dynamically loads and instantiates provisioning modules
"""

from typing import Dict, Optional
import importlib
import logging

logger = logging.getLogger(__name__)


class ProvisioningModuleFactory:
    """
    Factory class to create provisioning modules
    Similar to WHMCS module system
    """
    
    _modules = {}
    
    @classmethod
    def register_module(cls, module_name: str, module_class):
        """Register a provisioning module"""
        cls._modules[module_name] = module_class
        logger.info(f"Registered provisioning module: {module_name}")
    
    @classmethod
    def get_module(cls, module_name: str, config: Optional[Dict] = None) -> 'ProvisioningModule':
        """
        Get provisioning module instance
        
        Args:
            module_name: Name of the module (e.g., 'manual', 'ovh', 'hetzner')
            config: Module-specific configuration
        
        Returns:
            ProvisioningModule instance
        """
        if module_name not in cls._modules:
            # Try to load module dynamically
            try:
                module_path = f"app.services.provisioning.{module_name}"
                module = importlib.import_module(module_path)
                module_class = getattr(module, f"{module_name.capitalize()}ProvisioningModule")
                cls.register_module(module_name, module_class)
            except (ImportError, AttributeError) as e:
                logger.error(f"Failed to load module {module_name}: {e}")
                # Fallback to manual module
                from app.services.provisioning.manual import ManualProvisioningModule
                return ManualProvisioningModule()
        
        module_class = cls._modules[module_name]
        return module_class(config or {})
    
    @classmethod
    def list_available_modules(cls) -> list:
        """List all available provisioning modules"""
        return list(cls._modules.keys())


# Auto-register modules on import
def register_default_modules():
    """Register default provisioning modules"""
    try:
        from app.services.provisioning.manual import ManualProvisioningModule
        ProvisioningModuleFactory.register_module('manual', ManualProvisioningModule)
    except ImportError:
        pass
    
    try:
        from app.services.provisioning.ovh import OVHProvisioningModule
        ProvisioningModuleFactory.register_module('ovh', OVHProvisioningModule)
    except ImportError:
        pass
    
    try:
        from app.services.provisioning.hetzner import HetznerProvisioningModule
        ProvisioningModuleFactory.register_module('hetzner', HetznerProvisioningModule)
    except ImportError:
        pass
    
    try:
        from app.services.provisioning.digitalocean import DigitalOceanProvisioningModule
        ProvisioningModuleFactory.register_module('digitalocean', DigitalOceanProvisioningModule)
    except ImportError:
        pass


# Register modules when factory is imported
register_default_modules()

