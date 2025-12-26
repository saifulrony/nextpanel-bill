"""
Migration script to create vps_api_keys table
"""
import asyncio
import sys
from sqlalchemy import text
from app.core.database import AsyncSessionLocal
from app.core.config import settings

async def create_table():
    """Create vps_api_keys table"""
    async with AsyncSessionLocal() as session:
        try:
            # Check if table exists
            check_table = text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='vps_api_keys'
            """)
            result = await session.execute(check_table)
            if result.fetchone():
                print("Table vps_api_keys already exists")
                return

            # Create table
            create_table_sql = text("""
                CREATE TABLE IF NOT EXISTS vps_api_keys (
                    id TEXT PRIMARY KEY,
                    customer_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    api_key TEXT NOT NULL UNIQUE,
                    vps_panel_url TEXT,
                    is_active INTEGER DEFAULT 1,
                    last_used_at TEXT,
                    expires_at TEXT,
                    description TEXT,
                    permissions TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT,
                    FOREIGN KEY (customer_id) REFERENCES users(id)
                )
            """)
            
            await session.execute(create_table_sql)
            await session.commit()
            
            # Create indexes
            create_indexes = [
                text("CREATE INDEX IF NOT EXISTS idx_vps_api_keys_customer_id ON vps_api_keys(customer_id)"),
                text("CREATE INDEX IF NOT EXISTS idx_vps_api_keys_api_key ON vps_api_keys(api_key)"),
            ]
            
            for index_sql in create_indexes:
                await session.execute(index_sql)
            
            await session.commit()
            print("Table vps_api_keys created successfully")
            
        except Exception as e:
            await session.rollback()
            print(f"Error creating table: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(create_table())

