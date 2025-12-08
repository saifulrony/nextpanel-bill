#!/usr/bin/env python3
"""
Migration script to create staff management tables
Run this to create all the new staff-related tables
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, Base
from app.models import *  # Import all models to register them


async def migrate():
    """Run migrations"""
    print("Starting staff tables migration...")
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            print("Creating/updating tables...")
            await conn.run_sync(Base.metadata.create_all)
            
            # Check if staff_roles table exists and add new columns if needed
            try:
                result = await conn.execute(text("PRAGMA table_info(staff_roles)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'level' not in columns:
                    print("Adding 'level' column to staff_roles...")
                    await conn.execute(text("ALTER TABLE staff_roles ADD COLUMN level INTEGER DEFAULT 0"))
                
                if 'parent_role_id' not in columns:
                    print("Adding 'parent_role_id' column to staff_roles...")
                    await conn.execute(text("ALTER TABLE staff_roles ADD COLUMN parent_role_id TEXT REFERENCES staff_roles(id)"))
                    
            except Exception as e:
                print(f"⚠️ Warning checking staff_roles: {e}")
            
            # Check if user_roles table exists and add expires_at if needed
            try:
                result = await conn.execute(text("PRAGMA table_info(user_roles)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'expires_at' not in columns:
                    print("Adding 'expires_at' column to user_roles...")
                    await conn.execute(text("ALTER TABLE user_roles ADD COLUMN expires_at DATETIME"))
                    
            except Exception as e:
                print(f"⚠️ Warning checking user_roles: {e}")
        
        print("\n✅ Migration completed successfully!")
        print("\nNew tables created:")
        print("  - staff_audit_logs")
        print("  - staff_activity_logs")
        print("  - user_permission_overrides")
        print("  - permission_groups")
        print("  - permission_group_permissions")
        print("\nUpdated tables:")
        print("  - staff_roles (added level, parent_role_id)")
        print("  - user_roles (added expires_at)")
        
        return True
    
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    result = asyncio.run(migrate())
    sys.exit(0 if result else 1)

