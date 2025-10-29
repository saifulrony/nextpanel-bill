"""
Plugin Installer - Downloads and installs plugins from local or remote sources
"""
import os
import json
import shutil
import zipfile
import requests
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any
from .plugin_config import PluginConfig

class PluginInstaller:
    """
    Install and uninstall plugins from local or remote sources
    Automatically switches based on PluginConfig.SOURCE
    """
    
    def __init__(self):
        self.config = PluginConfig()
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create necessary directories if they don't exist"""
        os.makedirs(self.config.BACKEND_ADDONS_DIR, exist_ok=True)
        os.makedirs(self.config.FRONTEND_APP_DIR, exist_ok=True)
    
    async def install(self, plugin_id: str, version: str = "latest") -> Dict[str, Any]:
        """
        Install a plugin
        
        Steps:
        1. Download plugin (from local or remote)
        2. Extract to temp directory
        3. Read and validate metadata
        4. Install backend files
        5. Install frontend files
        6. Run database migrations
        7. Register in addon_registry.json
        8. Cleanup temp files
        
        Returns:
            Dict with installation status and info
        """
        temp_dir = None
        
        try:
            print(f"🔌 Installing plugin: {plugin_id} v{version}")
            print(f"📍 Source: {self.config.SOURCE}")
            
            # Step 1: Download plugin
            zip_path = await self._download_plugin(plugin_id, version)
            
            # Step 2: Extract
            temp_dir = self._extract_plugin(zip_path)
            
            # Step 3: Read metadata
            metadata = self._read_metadata(temp_dir)
            self._validate_metadata(metadata)
            
            # Step 4: Check if already installed
            if self._is_installed(plugin_id):
                raise Exception(f"Plugin {plugin_id} is already installed")
            
            # Step 5: Install backend files
            print(f"📦 Installing backend files...")
            self._install_backend(temp_dir, plugin_id)
            
            # Step 6: Install frontend files
            print(f"🎨 Installing frontend files...")
            self._install_frontend(temp_dir, plugin_id)
            
            # Step 7: Run database migrations
            print(f"💾 Running database migrations...")
            self._run_migrations(temp_dir, "up")
            
            # Step 8: Register plugin
            print(f"📝 Registering plugin...")
            self._register_plugin(plugin_id, metadata)
            
            # Step 9: Trigger Next.js rebuild
            print(f"🔄 Triggering Next.js rebuild...")
            from app.core.nextjs_trigger import NextJSTrigger
            trigger = NextJSTrigger()
            trigger.trigger_rebuild("install")
            
            print(f"✅ Plugin {plugin_id} installed successfully!")
            
            return {
                "success": True,
                "plugin_id": plugin_id,
                "version": metadata.get("version"),
                "message": "Plugin installed successfully! Restart Next.js dev server (npm run dev) to see changes.",
                "restart_required": True,
                "instructions": [
                    "1. Stop Next.js dev server (Ctrl+C)",
                    "2. Start it again: npm run dev",
                    "3. Wait 5-10 seconds for compilation",
                    "4. Refresh /support/chats - it will work!"
                ]
            }
            
        except Exception as e:
            print(f"❌ Installation failed: {e}")
            import traceback
            traceback.print_exc()
            # Don't rollback on error to avoid recursive errors
            raise Exception(f"Installation failed: {str(e)}")
            
        finally:
            # Cleanup temp files
            if temp_dir and os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
    
    async def uninstall(self, plugin_id: str, silent: bool = False) -> Dict[str, Any]:
        """
        Uninstall a plugin
        
        Steps:
        1. Run reverse database migrations
        2. Delete backend files
        3. Delete frontend files
        4. Unregister from addon_registry.json
        
        Returns:
            Dict with uninstallation status
        """
        try:
            if not silent:
                print(f"🗑️  Uninstalling plugin: {plugin_id}")
            
            # Step 1: Get plugin info
            metadata = self._get_plugin_metadata(plugin_id)
            
            # Step 2: Run reverse migrations
            backend_path = os.path.join(self.config.BACKEND_ADDONS_DIR, plugin_id)
            if os.path.exists(backend_path):
                migrations_dir = os.path.join(backend_path, "migrations")
                if os.path.exists(migrations_dir):
                    if not silent:
                        print(f"💾 Reversing database migrations...")
                    self._run_migration_file(os.path.join(migrations_dir, "down.sql"))
            
            # Step 3: Delete backend files
            if os.path.exists(backend_path):
                if not silent:
                    print(f"🗑️  Removing backend files...")
                try:
                    shutil.rmtree(backend_path)
                except PermissionError as e:
                    if not silent:
                        print(f"  ⚠️  Permission error removing backend files: {e}")
                        print(f"  ℹ️  Backend files may need manual cleanup: {backend_path}")
                    # Continue with uninstallation even if backend cleanup fails
            
            # Step 4: Delete frontend route files
            if not silent:
                print(f"🗑️  Removing frontend route files...")
            self._uninstall_frontend(plugin_id)
            
            # Step 5: Unregister
            if not silent:
                print(f"📝 Unregistering plugin...")
            self._unregister_plugin(plugin_id)
            
            # Step 6: Trigger Next.js rebuild
            if not silent:
                print(f"🔄 Triggering Next.js rebuild...")
                from app.core.nextjs_trigger import NextJSTrigger
                trigger = NextJSTrigger()
                trigger.trigger_rebuild("uninstall")
            
            if not silent:
                print(f"✅ Plugin {plugin_id} uninstalled successfully!")
            
            return {
                "success": True,
                "plugin_id": plugin_id,
                "message": "Plugin uninstalled successfully! Restart Next.js dev server to see changes.",
                "restart_required": True,
                "instructions": [
                    "1. Stop Next.js dev server (Ctrl+C)",
                    "2. Start it again: npm run dev",
                    "3. Wait 5-10 seconds",
                    "4. /support/chats will be 404 (truly gone!)"
                ]
            }
            
        except Exception as e:
            if not silent:
                print(f"❌ Uninstallation failed: {e}")
            raise Exception(f"Uninstallation failed: {str(e)}")
    
    async def _download_plugin(self, plugin_id: str, version: str) -> str:
        """
        Download plugin from local or remote source
        
        Returns path to downloaded ZIP file
        """
        plugin_url = self.config.get_plugin_url(plugin_id, version)
        temp_zip = f"/tmp/{plugin_id}_v{version}.zip"
        
        if self.config.is_local_source():
            # Local source - copy file
            print(f"📁 Loading from local: {plugin_url}")
            local_path = plugin_url.replace("file://", "")
            
            if not os.path.exists(local_path):
                raise FileNotFoundError(f"Plugin not found: {local_path}")
            
            shutil.copy(local_path, temp_zip)
            
        else:
            # Remote source - download via HTTP
            print(f"🌐 Downloading from: {plugin_url}")
            response = requests.get(plugin_url, stream=True, timeout=30)
            response.raise_for_status()
            
            with open(temp_zip, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
        
        print(f"✅ Downloaded to: {temp_zip}")
        return temp_zip
    
    def _extract_plugin(self, zip_path: str) -> str:
        """Extract plugin ZIP to temp directory"""
        extract_dir = zip_path.replace('.zip', '_extracted')
        
        print(f"📦 Extracting to: {extract_dir}")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        return extract_dir
    
    def _read_metadata(self, plugin_dir: str) -> Dict[str, Any]:
        """Read plugin metadata.json"""
        metadata_path = os.path.join(plugin_dir, "metadata.json")
        
        if not os.path.exists(metadata_path):
            raise FileNotFoundError("metadata.json not found in plugin")
        
        with open(metadata_path, 'r') as f:
            return json.load(f)
    
    def _validate_metadata(self, metadata: Dict[str, Any]):
        """Validate plugin metadata"""
        required_fields = ["id", "name", "version"]
        
        for field in required_fields:
            if field not in metadata:
                raise ValueError(f"Missing required field in metadata: {field}")
    
    def _install_backend(self, plugin_dir: str, plugin_id: str):
        """Copy backend files to addons directory"""
        src = os.path.join(plugin_dir, "backend")
        dst = os.path.join(self.config.BACKEND_ADDONS_DIR, plugin_id)
        
        if os.path.exists(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
            print(f"  ✅ Backend files installed to: {dst}")
        
        # Also copy migrations folder to backend addon
        migrations_src = os.path.join(plugin_dir, "migrations")
        migrations_dst = os.path.join(dst, "migrations")
        if os.path.exists(migrations_src):
            shutil.copytree(migrations_src, migrations_dst, dirs_exist_ok=True)
            print(f"  ✅ Migrations installed")
    
    def _install_frontend(self, plugin_dir: str, plugin_id: str):
        """
        Copy frontend files directly into /app/ directory
        This allows Next.js to auto-detect new routes (TRUE modularity!)
        """
        src = os.path.join(plugin_dir, "frontend")
        
        if os.path.exists(src):
            # For ai_chatbot: install to /support/chats/
            # Routes defined in plugin metadata
            metadata = self._read_metadata(plugin_dir)
            routes = metadata.get("frontend", {}).get("routes", [])
            
            for route in routes:
                # e.g., route = "/admin/support/chats"
                # Install to /app/admin/support/chats/
                route_path = route.lstrip('/')
                dst = os.path.join(self.config.FRONTEND_APP_DIR, route_path)
                
                # Create the directory if it doesn't exist
                os.makedirs(dst, exist_ok=True)
                
                # Copy page files
                page_src = os.path.join(src, "pages")
                if os.path.exists(page_src):
                    # Copy all files from pages directory to the route directory
                    for item in os.listdir(page_src):
                        src_item = os.path.join(page_src, item)
                        dst_item = os.path.join(dst, item)
                        if os.path.isdir(src_item):
                            shutil.copytree(src_item, dst_item, dirs_exist_ok=True)
                        else:
                            shutil.copy2(src_item, dst_item)
                    print(f"  ✅ Frontend route installed: {route} → {dst}")
                else:
                    print(f"  ⚠️  No pages directory found in plugin frontend")
            
            # Also copy components to a shared location for reuse
            components_src = os.path.join(src, "components")
            if os.path.exists(components_src):
                components_dst = os.path.join(
                    os.path.dirname(self.config.FRONTEND_APP_DIR),
                    "components",
                    "addons",
                    plugin_id
                )
                shutil.copytree(components_src, components_dst, dirs_exist_ok=True)
                print(f"  ✅ Frontend components installed: {components_dst}")
    
    def _run_migrations(self, plugin_dir: str, direction: str):
        """Run database migrations (up or down)"""
        migrations_dir = os.path.join(plugin_dir, "migrations")
        sql_file = os.path.join(migrations_dir, f"{direction}.sql")
        
        if os.path.exists(sql_file):
            self._run_migration_file(sql_file)
    
    def _run_migration_file(self, sql_file: str):
        """Execute SQL migration file"""
        if not os.path.exists(sql_file):
            return
        
        with open(sql_file, 'r') as f:
            sql = f.read()
        
        if not sql.strip():
            return
        
        # Execute SQL
        db_path = os.path.join(
            os.path.dirname(os.path.dirname(self.config.BACKEND_ADDONS_DIR)),
            "billing.db"
        )
        
        if not os.path.exists(db_path):
            print(f"  ❌ Database not found: {db_path}")
            raise FileNotFoundError(f"Database not found: {db_path}")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Split and execute each statement
            statements = [s.strip() for s in sql.split(';') if s.strip()]
            for statement in statements:
                if statement:
                    cursor.execute(statement)
            conn.commit()
            print(f"  ✅ Executed migration: {os.path.basename(sql_file)}")
        except Exception as e:
            conn.rollback()
            print(f"  ❌ Migration failed: {e}")
            raise
        finally:
            conn.close()
    
    def _register_plugin(self, plugin_id: str, metadata: Dict[str, Any]):
        """Register plugin in addon_registry.json"""
        registry = self._load_registry()
        
        registry[plugin_id] = {
            "id": metadata.get("id"),
            "name": metadata.get("name"),
            "version": metadata.get("version"),
            "installed_at": __import__('datetime').datetime.now().isoformat(),
            "enabled": True,
            "metadata": metadata
        }
        
        self._save_registry(registry)
    
    def _unregister_plugin(self, plugin_id: str):
        """Remove plugin from addon_registry.json"""
        registry = self._load_registry()
        
        if plugin_id in registry:
            del registry[plugin_id]
            self._save_registry(registry)
    
    def _load_registry(self) -> Dict[str, Any]:
        """Load addon registry"""
        if os.path.exists(self.config.REGISTRY_FILE):
            with open(self.config.REGISTRY_FILE, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_registry(self, registry: Dict[str, Any]):
        """Save addon registry"""
        with open(self.config.REGISTRY_FILE, 'w') as f:
            json.dump(registry, f, indent=2)
    
    def _is_installed(self, plugin_id: str) -> bool:
        """Check if plugin is already installed"""
        registry = self._load_registry()
        return plugin_id in registry
    
    def _get_plugin_metadata(self, plugin_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for installed plugin"""
        registry = self._load_registry()
        return registry.get(plugin_id, {}).get("metadata")
    
    def list_installed(self) -> Dict[str, Any]:
        """List all installed plugins"""
        return self._load_registry()
    
    def _uninstall_frontend(self, plugin_id: str):
        """
        Delete frontend route files installed by the plugin
        Removes pages directly from /app/ directory (TRUE modularity!)
        """
        # Get plugin metadata to know which routes to remove
        metadata = self._get_plugin_metadata(plugin_id)
        
        if metadata:
            routes = metadata.get("frontend", {}).get("routes", [])
        else:
            # If no metadata available, try common routes based on plugin_id
            print(f"  ⚠️  No metadata found for {plugin_id}, using fallback routes")
            if plugin_id == "ai_chatbot":
                routes = ["/admin/support/chats", "/customer/support/chats"]
            else:
                routes = []
        
        for route in routes:
            # e.g., route = "/admin/support/chats"
            # Delete from /app/admin/support/chats/
            route_path = route.lstrip('/')
            route_dir = os.path.join(self.config.FRONTEND_APP_DIR, route_path)
            
            if os.path.exists(route_dir):
                shutil.rmtree(route_dir)
                print(f"  ✅ Removed frontend route: {route}")
            else:
                print(f"  ⚠️  Route directory not found: {route_dir}")
        
        # Remove shared components
        components_dir = os.path.join(
            os.path.dirname(self.config.FRONTEND_APP_DIR),
            "components",
            "addons",
            plugin_id
        )
        if os.path.exists(components_dir):
            shutil.rmtree(components_dir)
            print(f"  ✅ Removed frontend components")

