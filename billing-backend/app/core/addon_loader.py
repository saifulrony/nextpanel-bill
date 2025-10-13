"""
Addon Loader - Dynamically loads and registers addon routes at startup
"""
import os
import json
import importlib.util
import sys
from pathlib import Path
from typing import List
from fastapi import FastAPI

class AddonLoader:
    """
    Loads installed addons and registers their routes
    Runs at application startup
    """
    
    def __init__(self, addons_dir: str):
        self.addons_dir = Path(addons_dir)
        self.registry_file = self.addons_dir / "addon_registry.json"
    
    def get_installed_addons(self) -> List[str]:
        """Get list of installed and enabled addon IDs"""
        if not self.registry_file.exists():
            return []
        
        try:
            with open(self.registry_file, 'r') as f:
                registry = json.load(f)
            
            # Return addon IDs that are enabled
            return [
                addon_id for addon_id, info in registry.items()
                if info.get('enabled', True)
            ]
        except Exception as e:
            print(f"⚠️  Failed to load addon registry: {e}")
            return []
    
    def load_addon_routes(self, addon_id: str):
        """
        Dynamically import and return router from addon
        """
        addon_path = self.addons_dir / addon_id
        routes_file = addon_path / "routes.py"
        
        if not routes_file.exists():
            print(f"  ⚠️  No routes.py found for addon: {addon_id}")
            return None
        
        try:
            # Dynamically import the routes module
            spec = importlib.util.spec_from_file_location(
                f"addon_{addon_id}_routes",
                routes_file
            )
            module = importlib.util.module_from_spec(spec)
            
            # Remove old module if exists (for hot reload)
            if spec.name in sys.modules:
                del sys.modules[spec.name]
            
            sys.modules[spec.name] = module
            spec.loader.exec_module(module)
            
            # Get router from module
            if hasattr(module, 'router'):
                print(f"  ✅ Loaded routes for addon: {addon_id}")
                return module.router
            else:
                print(f"  ⚠️  No router found in {addon_id}/routes.py")
                return None
                
        except Exception as e:
            print(f"  ❌ Failed to load addon {addon_id}: {e}")
            return None
    
    def register_all_addons(self, app: FastAPI):
        """
        Register all installed addon routes with the FastAPI app
        Call this at application startup
        """
        installed_addons = self.get_installed_addons()
        
        if not installed_addons:
            print("ℹ️  No addons installed")
            return
        
        print(f"🔌 Loading {len(installed_addons)} installed addon(s)...")
        
        for addon_id in installed_addons:
            router = self.load_addon_routes(addon_id)
            if router:
                try:
                    app.include_router(router, prefix="/api/v1")
                    print(f"  ✅ Registered routes for: {addon_id}")
                except Exception as e:
                    print(f"  ❌ Failed to register {addon_id}: {e}")
        
        print("✅ Addon loading complete")

