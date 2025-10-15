"""
Migration: Add pages table for page builder
Run this to add the pages table to your database
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


async def run_migration():
    """Add pages table to database"""
    
    async with engine.begin() as conn:
        # Create pages table (SQLite compatible)
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS pages (
                id TEXT PRIMARY KEY,
                slug TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                components TEXT NOT NULL DEFAULT '[]',
                metadata TEXT DEFAULT '{}',
                is_active TEXT DEFAULT 'active',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Create index on slug
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
        """))
        
        # Create index on is_active
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_pages_is_active ON pages(is_active);
        """))
        
        print("✅ Pages table created successfully!")
        print("✅ Indexes created successfully!")
        
        # Insert default pages
        await conn.execute(text("""
            INSERT OR IGNORE INTO pages (id, slug, title, description, components, is_active)
            VALUES 
                ('1', 'home', 'Home Page', 'Main landing page', '[]', 'active'),
                ('2', 'cart', 'Cart Page', 'Shopping cart page', '[]', 'active'),
                ('3', 'checkout', 'Checkout Page', 'Order checkout page', '[]', 'active'),
                ('4', 'order-confirmation', 'Order Confirmation', 'Order confirmation page', '[]', 'active');
        """))
        
        print("✅ Default pages created successfully!")


if __name__ == "__main__":
    print("🚀 Starting migration: Add pages table...")
    asyncio.run(run_migration())
    print("✅ Migration completed successfully!")

