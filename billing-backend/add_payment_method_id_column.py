#!/usr/bin/env python3
"""
Migration script to add payment_method_id column to payments table
"""
import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), 'billing.db')
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(payments)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'payment_method_id' in columns:
            print("Column 'payment_method_id' already exists in payments table")
            conn.close()
            return
        
        # Add the column
        print("Adding payment_method_id column to payments table...")
        cursor.execute("""
            ALTER TABLE payments 
            ADD COLUMN payment_method_id VARCHAR(255)
        """)
        
        conn.commit()
        print("✅ Successfully added payment_method_id column to payments table")
        
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

