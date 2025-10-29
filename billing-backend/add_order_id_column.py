#!/usr/bin/env python3
"""
Migration script to add order_id column to payments table
"""
import sqlite3
import os

def migrate():
    # Get the database path
    db_path = os.path.join(os.path.dirname(__file__), 'billing.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if order_id column exists
        cursor.execute('PRAGMA table_info(payments)')
        columns = [col[1] for col in cursor.fetchall()]
        print('Current payment columns:', columns)
        
        if 'order_id' not in columns:
            print('Adding order_id column...')
            cursor.execute('ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id)')
            conn.commit()
            print('✅ order_id column added successfully')
        else:
            print('✅ order_id column already exists')
        
        # Verify the column was added
        cursor.execute('PRAGMA table_info(payments)')
        columns = [col[1] for col in cursor.fetchall()]
        print('Updated payment columns:', columns)
        
    except Exception as e:
        print(f'❌ Error: {e}')
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
