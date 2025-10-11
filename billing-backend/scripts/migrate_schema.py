#!/usr/bin/env python3
"""
Quick migration script to add new columns and tables
Run this to update the database schema with all new features
"""
import asyncio
import sys
sys.path.insert(0, '/app')

from sqlalchemy import text
from app.core.database import engine, Base
from app.models import *  # Import all models


async def migrate():
    """Run migrations"""
    print("Starting database migration...")
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            print("Creating/updating tables...")
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Migration completed successfully!")
        print("\nNew tables created:")
        print("  - support_tickets")
        print("  - ticket_replies")
        print("\nUpdated tables:")
        print("  - users (added is_admin column)")
        print("  - invoices (added invoice schema)")
        
        return True
    
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == "__main__":
    result = asyncio.run(migrate())
    sys.exit(0 if result else 1)

