"""
Plugin configuration - Switch between local and remote sources
"""
import os
from enum import Enum

class PluginSource(str, Enum):
    LOCAL = "local"
    REMOTE = "remote"

class PluginConfig:
    """
    Configure where plugins are sourced from
    Switch between local development and remote production
    """
    
    # Change this to switch plugin source
    SOURCE = os.getenv("PLUGIN_SOURCE", PluginSource.REMOTE)
    
    # Local plugin directory (for development)
    LOCAL_PLUGINS_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../billing-frontend/modules")
    )
    
    # Remote plugin server (for production)
    REMOTE_PLUGINS_URL = os.getenv(
        "PLUGIN_SERVER_URL", 
        "http://localhost:8080"
    )
    
    # Backend addons directory (where plugins get installed)
    BACKEND_ADDONS_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../addons")
    )
    
    # Frontend addons directory (where frontend components go)
    # Installs directly into /app/ for Next.js hot-reload (TRUE modularity!)
    FRONTEND_APP_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../billing-frontend/src/app")
    )
    
    # Plugin registry file
    REGISTRY_FILE = os.path.join(BACKEND_ADDONS_DIR, "addon_registry.json")
    
    @classmethod
    def get_plugin_url(cls, plugin_id: str, version: str = "latest") -> str:
        """
        Get plugin download URL based on source
        
        LOCAL: file:///path/to/modules/ai_chatbot_v1.0.0.zip
        REMOTE: https://dbuh.com/plugins/download/ai_chatbot/1.0.0
        """
        if cls.SOURCE == PluginSource.LOCAL:
            return f"file://{cls.LOCAL_PLUGINS_DIR}/{plugin_id}_v{version}.zip"
        else:
            return f"{cls.REMOTE_PLUGINS_URL}/download/{plugin_id}/{version}"
    
    @classmethod
    def is_local_source(cls) -> bool:
        """Check if using local plugin source"""
        return cls.SOURCE == PluginSource.LOCAL
    
    @classmethod
    def is_remote_source(cls) -> bool:
        """Check if using remote plugin source"""
        return cls.SOURCE == PluginSource.REMOTE


# Easy access
config = PluginConfig()

