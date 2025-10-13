# 🔌 Plugin Download & Installation System

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Plugin Repository Server (Your Control)                    │
│  https://plugins.nextpanel.com or http://your-server:8002  │
│                                                              │
│  /plugins/                                                   │
│    ├── manifest.json                                        │
│    ├── ai_chatbot/                                          │
│    │   ├── v1.0.0.zip                                      │
│    │   ├── backend/   (Python code)                        │
│    │   ├── frontend/  (React components)                   │
│    │   └── metadata.json                                   │
│    ├── email_marketing/                                     │
│    └── sms_notifications/                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓ Download on Install
┌─────────────────────────────────────────────────────────────┐
│  Customer's NextPanel Installation                          │
│  http://customer-ip:3000                                    │
│                                                              │
│  billing-backend/                                           │
│    └── addons/  (Downloaded & Extracted)                   │
│        └── ai_chatbot/                                      │
│            ├── __init__.py                                  │
│            ├── models.py                                    │
│            ├── routes.py                                    │
│            └── install.py                                   │
│                                                              │
│  billing-frontend/                                          │
│    └── src/addons/  (Downloaded & Extracted)               │
│        └── ai_chatbot/                                      │
│            ├── pages/                                       │
│            ├── components/                                  │
│            └── addon.config.ts                              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Plugin Package Structure

### **Plugin ZIP Structure**
```
ai_chatbot_v1.0.0.zip
├── metadata.json                 # Plugin info
├── backend/                      # Backend code
│   ├── __init__.py
│   ├── models.py                 # Database models
│   ├── routes.py                 # API endpoints
│   ├── schemas.py                # Pydantic schemas
│   ├── services.py               # Business logic
│   └── install.py                # Installation script
├── frontend/                     # Frontend code
│   ├── pages/
│   │   └── ChatsPage.tsx
│   ├── components/
│   │   ├── AIChatBot.tsx
│   │   └── ChatWidget.tsx
│   └── addon.config.ts           # Route registration
└── migrations/                   # Database migrations
    ├── up.sql                    # Create tables
    └── down.sql                  # Drop tables
```

### **metadata.json**
```json
{
  "id": "ai_chatbot",
  "name": "AI Chatbot",
  "version": "1.0.0",
  "author": "NextPanel Team",
  "description": "AI-powered customer support chatbot",
  "category": "communication",
  "price": 0,
  "requires": [],
  "backend": {
    "models": ["ChatSession", "ChatMessage"],
    "routes": ["/api/v1/chat/*"],
    "dependencies": ["openai>=1.0.0"]
  },
  "frontend": {
    "routes": ["/support/chats"],
    "components": ["AIChatBot"],
    "dependencies": {}
  },
  "permissions": [
    "database.create_tables",
    "api.register_routes",
    "filesystem.write"
  ]
}
```

## 🔧 Implementation

### **Step 1: Plugin Repository Server**

Simple server to host plugins (can use any hosting):

```python
# plugin_server.py (Simple Flask server)
from flask import Flask, send_file, jsonify
import os

app = Flask(__name__)
PLUGIN_DIR = "/var/www/plugins"

@app.route('/manifest.json')
def get_manifest():
    """List all available plugins"""
    return jsonify({
        "plugins": [
            {
                "id": "ai_chatbot",
                "version": "1.0.0",
                "download_url": "/download/ai_chatbot/1.0.0"
            },
            # ... more plugins
        ]
    })

@app.route('/download/<plugin_id>/<version>')
def download_plugin(plugin_id, version):
    """Download plugin package"""
    file_path = f"{PLUGIN_DIR}/{plugin_id}/v{version}.zip"
    return send_file(file_path, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8002)
```

### **Step 2: Backend Plugin Installer**

```python
# billing-backend/app/core/plugin_installer.py
import requests
import zipfile
import os
import shutil
from pathlib import Path
import subprocess
import importlib

class PluginInstaller:
    def __init__(self, plugin_server_url="http://plugins.nextpanel.com"):
        self.plugin_server_url = plugin_server_url
        self.backend_addon_dir = Path(__file__).parent.parent / "addons"
        self.frontend_addon_dir = Path(__file__).parent.parent.parent.parent / "billing-frontend/src/addons"
        
    async def install_plugin(self, plugin_id: str, version: str = "latest"):
        """
        Download and install a plugin
        """
        try:
            # 1. Download plugin
            print(f"📥 Downloading {plugin_id}...")
            zip_path = await self._download_plugin(plugin_id, version)
            
            # 2. Extract plugin
            print(f"📦 Extracting {plugin_id}...")
            extract_dir = self._extract_plugin(zip_path)
            
            # 3. Read metadata
            metadata = self._read_metadata(extract_dir)
            
            # 4. Check dependencies
            self._check_dependencies(metadata)
            
            # 5. Install backend files
            print(f"🔧 Installing backend files...")
            self._install_backend(extract_dir, plugin_id)
            
            # 6. Install frontend files
            print(f"🎨 Installing frontend files...")
            self._install_frontend(extract_dir, plugin_id)
            
            # 7. Run database migrations
            print(f"💾 Running migrations...")
            await self._run_migrations(extract_dir, "up")
            
            # 8. Register plugin
            print(f"📝 Registering plugin...")
            self._register_plugin(plugin_id, metadata)
            
            # 9. Cleanup
            os.remove(zip_path)
            shutil.rmtree(extract_dir)
            
            print(f"✅ Plugin {plugin_id} installed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Installation failed: {e}")
            # Rollback
            await self.uninstall_plugin(plugin_id)
            raise
    
    async def uninstall_plugin(self, plugin_id: str):
        """
        Uninstall a plugin
        """
        try:
            print(f"🗑️  Uninstalling {plugin_id}...")
            
            # 1. Run reverse migrations
            backend_path = self.backend_addon_dir / plugin_id
            if backend_path.exists():
                migrations_path = backend_path / "migrations"
                if migrations_path.exists():
                    await self._run_migrations(backend_path, "down")
            
            # 2. Remove backend files
            if backend_path.exists():
                shutil.rmtree(backend_path)
            
            # 3. Remove frontend files
            frontend_path = self.frontend_addon_dir / plugin_id
            if frontend_path.exists():
                shutil.rmtree(frontend_path)
            
            # 4. Unregister plugin
            self._unregister_plugin(plugin_id)
            
            print(f"✅ Plugin {plugin_id} uninstalled successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Uninstallation failed: {e}")
            raise
    
    async def _download_plugin(self, plugin_id: str, version: str):
        """Download plugin from server"""
        url = f"{self.plugin_server_url}/download/{plugin_id}/{version}"
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        zip_path = f"/tmp/{plugin_id}_{version}.zip"
        with open(zip_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return zip_path
    
    def _extract_plugin(self, zip_path: str):
        """Extract plugin to temp directory"""
        extract_dir = zip_path.replace('.zip', '_extracted')
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        return extract_dir
    
    def _install_backend(self, extract_dir: str, plugin_id: str):
        """Copy backend files to addons directory"""
        src = os.path.join(extract_dir, "backend")
        dst = self.backend_addon_dir / plugin_id
        
        if os.path.exists(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
    
    def _install_frontend(self, extract_dir: str, plugin_id: str):
        """Copy frontend files to addons directory"""
        src = os.path.join(extract_dir, "frontend")
        dst = self.frontend_addon_dir / plugin_id
        
        if os.path.exists(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
    
    async def _run_migrations(self, path: str, direction: str):
        """Run SQL migrations"""
        migrations_dir = os.path.join(path, "migrations")
        sql_file = f"{direction}.sql"
        sql_path = os.path.join(migrations_dir, sql_file)
        
        if os.path.exists(sql_path):
            with open(sql_path, 'r') as f:
                sql = f.read()
            
            from app.core.database import get_db
            async for db in get_db():
                await db.execute(sql)
                await db.commit()
```

### **Step 3: Backend API Endpoint**

```python
# billing-backend/app/api/v1/marketplace.py (add to existing file)

from app.core.plugin_installer import PluginInstaller

@router.post("/install-remote")
async def install_plugin_from_server(
    request: AddonInstallRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """
    Download and install plugin from plugin server
    """
    try:
        installer = PluginInstaller()
        
        # Get addon info from database
        result = await db.execute(
            select(Addon).where(Addon.id == request.addon_id)
        )
        addon = result.scalars().first()
        
        if not addon:
            raise HTTPException(status_code=404, detail="Addon not found")
        
        # Install plugin
        await installer.install_plugin(addon.name, addon.version)
        
        # Create installation record
        installation = AddonInstallation(
            addon_id=request.addon_id,
            installed_by=current_user_id,
            settings=request.settings or {},
            is_enabled=True
        )
        
        db.add(installation)
        await db.commit()
        
        return {
            "message": "Plugin installed successfully",
            "addon_id": addon.id,
            "restart_required": True
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Installation failed: {str(e)}"
        )
```

## 🚀 Workflow

### **Installation:**
```
1. Admin clicks "Install" on AI Chatbot in marketplace
   ↓
2. Frontend calls: POST /api/v1/marketplace/install-remote
   ↓
3. Backend downloads: http://plugins.nextpanel.com/download/ai_chatbot/1.0.0
   ↓
4. Extracts ai_chatbot_v1.0.0.zip to /tmp/
   ↓
5. Copies backend/ to billing-backend/app/addons/ai_chatbot/
   ↓
6. Copies frontend/ to billing-frontend/src/addons/ai_chatbot/
   ↓
7. Runs migrations/up.sql (creates tables)
   ↓
8. Registers in addon_registry.json
   ↓
9. Returns success (may require restart)
   ↓
10. Admin refreshes page
    ↓
11. System loads new addon dynamically
    ✅ /support/chats now exists!
    ✅ Chatbot appears on homepage!
```

### **Uninstallation:**
```
1. Admin clicks "Uninstall"
   ↓
2. Backend runs migrations/down.sql (drops tables)
   ↓
3. Deletes billing-backend/app/addons/ai_chatbot/
   ↓
4. Deletes billing-frontend/src/addons/ai_chatbot/
   ↓
5. Removes from addon_registry.json
   ↓
6. Returns success
   ↓
7. Admin refreshes page
    ✅ Code completely removed!
    ✅ Tables dropped!
    ✅ Routes gone!
```

## ⚡ Quick Start

**Want me to implement this?** I can have a working version in ~4-6 hours:

1. ✅ Plugin download system
2. ✅ Install/uninstall scripts
3. ✅ Dynamic loading
4. ✅ Database migrations
5. ✅ Convert existing chatbot to plugin format

**This is much better than my previous suggestion!** 🎉

