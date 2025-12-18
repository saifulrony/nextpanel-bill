"""
Migration: Add order_id to invoices table

This migration adds the order_id column to link invoices to orders.
Run this script to update your database schema.
"""
import asyncio
from sqlalchemy import text
from app.core.database import async_session_maker

async def migrate():
    """Add order_id column to invoices table"""
    async with async_session_maker() as db:
        try:
            # Check if column already exists
            result = await db.execute(text("""
                SELECT COUNT(*) FROM pragma_table_info('invoices') 
                WHERE name = 'order_id'
            """))
            exists = result.scalar() > 0
            
            if exists:
                print("✅ Column 'order_id' already exists in invoices table")
                return
            
            # Add order_id column
            print("Adding order_id column to invoices table...")
            await db.execute(text("""
                ALTER TABLE invoices ADD COLUMN order_id VARCHAR(36)
            """))
            
            # Add foreign key constraint
            print("Adding foreign key constraint...")
            await db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id)
            """))
            
            # Note: SQLite doesn't support adding foreign key constraints via ALTER TABLE
            # The relationship is enforced at the application level via SQLAlchemy
            
            await db.commit()
            print("✅ Migration completed successfully!")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Migration failed: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(migrate())

