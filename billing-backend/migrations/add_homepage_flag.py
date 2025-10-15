"""
Migration: Add is_homepage flag to pages table
"""
import sqlite3
import os
import sys

def run_migration():
    """Add is_homepage column to pages table"""
    
    # Get database path
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'billing.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(pages)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_homepage' in columns:
            print("is_homepage column already exists")
            return True
        
        # Add the is_homepage column
        cursor.execute("ALTER TABLE pages ADD COLUMN is_homepage BOOLEAN DEFAULT FALSE")
        
        # Commit the changes
        conn.commit()
        print("Successfully added is_homepage column to pages table")
        
        return True
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
