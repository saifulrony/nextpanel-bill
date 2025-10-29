"""
Migration: Add order_id column to payments table
Run this to add the order_id column to the payments table
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


async def run_migration():
    """Add order_id column to payments table"""
    
    async with engine.begin() as conn:
        try:
            # Check if column already exists by querying the table structure
            result = await conn.execute(text("PRAGMA table_info(payments)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'order_id' in columns:
                print("✅ order_id column already exists in payments table")
                return
            
            # Add order_id column to payments table
            await conn.execute(text("""
                ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id);
            """))
            
            print("✅ order_id column added to payments table successfully!")
            
            # Verify the column was added
            result = await conn.execute(text("PRAGMA table_info(payments)"))
            columns = [row[1] for row in result.fetchall()]
            print(f"✅ Updated payments table columns: {', '.join(columns)}")
            
        except Exception as e:
            print(f"❌ Error running migration: {e}")
            raise


if __name__ == "__main__":
    print("🚀 Starting migration: Add order_id to payments table...")
    asyncio.run(run_migration())
    print("✅ Migration completed successfully!")
