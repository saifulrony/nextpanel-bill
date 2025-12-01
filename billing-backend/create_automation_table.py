#!/usr/bin/env python3
"""
Create order_automation_rules table
"""
import asyncio
import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, init_db
from app.models import OrderAutomationRule  # Import the model to register it

async def create_table():
    """Create the automation rules table"""
    print("Creating order_automation_rules table...")
    try:
        # Initialize database - this will create all tables
        await init_db()
        
        # Force creation of the automation rules table
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Table created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(create_table())
    sys.exit(0 if success else 1)

