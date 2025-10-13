"""
Migration script to add is_featured and sort_order columns to plans table
Run this script once to update the database schema.
"""
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    # Convert aiosqlite URL to regular sqlite for synchronous migration
    db_url = settings.DATABASE_URL.replace('sqlite+aiosqlite:', 'sqlite:')
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        try:
            # For SQLite, check if columns exist by trying to select them
            try:
                conn.execute(text("SELECT is_featured, sort_order FROM plans LIMIT 1"))
                print("ℹ️  Columns already exist, no migration needed")
                return
            except Exception:
                # Columns don't exist, proceed with migration
                pass
            
            # SQLite doesn't support adding multiple columns or DEFAULT in ALTER TABLE easily
            # We'll add them one by one
            try:
                print("Adding is_featured column...")
                conn.execute(text("ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0"))
                conn.commit()
                print("✅ Added is_featured column")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print("ℹ️  is_featured column already exists")
                else:
                    raise
            
            try:
                print("Adding sort_order column...")
                conn.execute(text("ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0"))
                conn.commit()
                print("✅ Added sort_order column")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    print("ℹ️  sort_order column already exists")
                else:
                    raise
            
            print("\n✅ Migration completed successfully!")
            print("\nYou can now mark products as featured in the dashboard.")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
            sys.exit(1)

if __name__ == "__main__":
    print("🔄 Starting database migration...")
    print(f"Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'local'}")
    migrate()

