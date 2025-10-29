#!/usr/bin/env python3

import sys
import os
sys.path.append('/home/saiful/nextpanel-bill/billing-backend')

from app.core.plugin_installer import PluginInstaller
import asyncio

async def test_simple_install():
    installer = PluginInstaller()
    
    print("=== TESTING SIMPLE PLUGIN INSTALLATION ===")
    print(f"Plugin source: {installer.config.SOURCE}")
    print(f"Frontend app dir: {installer.config.FRONTEND_APP_DIR}")
    print(f"Backend addons dir: {installer.config.BACKEND_ADDONS_DIR}")
    
    # Test database path
    db_path = os.path.join(
        os.path.dirname(os.path.dirname(installer.config.BACKEND_ADDONS_DIR)),
        "billing.db"
    )
    print(f"Database path: {db_path}")
    print(f"Database exists: {os.path.exists(db_path)}")
    
    try:
        print("\n=== TESTING INSTALLATION ===")
        result = await installer.install('ai_chatbot', '1.0.0')
        print(f"Installation result: {result}")
    except Exception as e:
        print(f"Installation failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_simple_install())
