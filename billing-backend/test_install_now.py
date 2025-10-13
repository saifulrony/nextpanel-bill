#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.plugin_installer import PluginInstaller

async def main():
    installer = PluginInstaller()
    
    print("🔌 Installing ai_chatbot plugin...")
    print(f"📍 Frontend install target: {installer.config.FRONTEND_APP_DIR}")
    print("")
    
    result = await installer.install("ai_chatbot", "1.0.0")
    
    print("")
    print("📁 Checking installation...")
    print("")
    
    # Check backend
    backend_path = "/home/saiful/nextpanel-bill/billing-backend/app/addons/ai_chatbot"
    if os.path.exists(backend_path):
        print(f"✅ Backend: {backend_path}")
        print(f"   Files: {os.listdir(backend_path)}")
    else:
        print(f"❌ Backend NOT found: {backend_path}")
    
    # Check frontend route
    frontend_route = "/home/saiful/nextpanel-bill/billing-frontend/src/app/(dashboard)/support/chats"
    if os.path.exists(frontend_route):
        print(f"✅ Frontend route: {frontend_route}")
        files = []
        for root, dirs, filenames in os.walk(frontend_route):
            for filename in filenames:
                files.append(filename)
        print(f"   Files: {files}")
    else:
        print(f"❌ Frontend route NOT found: {frontend_route}")
    
    # Check components
    components_path = "/home/saiful/nextpanel-bill/billing-frontend/src/components/addons/ai_chatbot"
    if os.path.exists(components_path):
        print(f"✅ Components: {components_path}")
        print(f"   Files: {os.listdir(components_path)}")
    else:
        print(f"❌ Components NOT found: {components_path}")
    
    print("")
    print("🎉 Installation complete!")
    print("⏱️  Wait 5-10 seconds for Next.js to compile")
    print("🔄 Then refresh /support/chats in your browser")

if __name__ == "__main__":
    asyncio.run(main())

