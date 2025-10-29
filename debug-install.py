#!/usr/bin/env python3

import sys
import os
sys.path.append('/home/saiful/nextpanel-bill/billing-backend')

from app.core.plugin_installer import PluginInstaller
import asyncio

async def debug_install():
    installer = PluginInstaller()
    
    print("=== DEBUGGING PLUGIN INSTALLATION ===")
    print(f"Plugin source: {installer.config.SOURCE}")
    print(f"Plugin URL: {installer.config.get_plugin_url('ai_chatbot', '1.0.0')}")
    print(f"Frontend app dir: {installer.config.FRONTEND_APP_DIR}")
    print(f"Backend addons dir: {installer.config.BACKEND_ADDONS_DIR}")
    
    try:
        print("\n=== TESTING DOWNLOAD ===")
        zip_path = await installer._download_plugin('ai_chatbot', '1.0.0')
        print(f"Downloaded to: {zip_path}")
        
        print("\n=== TESTING EXTRACTION ===")
        extract_dir = installer._extract_plugin(zip_path)
        print(f"Extracted to: {extract_dir}")
        
        print("\n=== TESTING METADATA ===")
        metadata = installer._read_metadata(extract_dir)
        print(f"Metadata: {metadata}")
        
        print("\n=== TESTING FRONTEND INSTALLATION ===")
        installer._install_frontend(extract_dir, 'ai_chatbot')
        
        print("\n=== INSTALLATION SUCCESSFUL ===")
        
    except Exception as e:
        print(f"\n=== INSTALLATION FAILED ===")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_install())
