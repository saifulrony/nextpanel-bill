#!/usr/bin/env python3

import os
import sys
sys.path.append('/home/saiful/nextpanel-bill/billing-backend')

from app.core.plugin_config import PluginConfig

def test_database():
    config = PluginConfig()
    
    print("=== TESTING DATABASE ACCESS ===")
    print(f"Backend addons dir: {config.BACKEND_ADDONS_DIR}")
    print(f"Backend addons dir exists: {os.path.exists(config.BACKEND_ADDONS_DIR)}")
    
    db_path = os.path.join(
        os.path.dirname(config.BACKEND_ADDONS_DIR),
        "billing.db"
    )
    
    print(f"Database path: {db_path}")
    print(f"Database exists: {os.path.exists(db_path)}")
    
    if os.path.exists(db_path):
        print(f"Database size: {os.path.getsize(db_path)} bytes")
    
    print(f"Frontend app dir: {config.FRONTEND_APP_DIR}")
    print(f"Frontend app dir exists: {os.path.exists(config.FRONTEND_APP_DIR)}")

if __name__ == "__main__":
    test_database()
