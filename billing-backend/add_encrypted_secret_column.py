#!/usr/bin/env python3
"""
Migration script to add all missing columns to licenses table
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
        # Check existing columns
        cursor.execute('PRAGMA table_info(licenses)')
        existing_columns = [col[1] for col in cursor.fetchall()]
        print('Current license columns:', existing_columns)
        
        # All columns that should exist in the License model
        columns_to_add = [
            ('encrypted_secret', 'TEXT'),
            ('hardware_fingerprint', 'TEXT'),
            ('allowed_fingerprints', 'TEXT'),  # JSON stored as TEXT in SQLite
            ('last_validation_at', 'TEXT'),  # DateTime stored as TEXT
            ('validation_count', 'INTEGER DEFAULT 0'),
            ('failed_validation_count', 'INTEGER DEFAULT 0'),
            ('last_validation_ip', 'TEXT'),
            ('is_suspicious', 'INTEGER DEFAULT 0'),  # Boolean stored as INTEGER
            ('suspicious_reason', 'TEXT'),
        ]
        
        added_count = 0
        for col_name, col_type in columns_to_add:
            if col_name not in existing_columns:
                print(f'Adding {col_name} column...')
                try:
                    cursor.execute(f'ALTER TABLE licenses ADD COLUMN {col_name} {col_type}')
                    conn.commit()
                    print(f'✅ {col_name} column added successfully')
                    added_count += 1
                except Exception as e:
                    if 'duplicate column' in str(e).lower():
                        print(f'ℹ️  {col_name} column already exists')
                    else:
                        print(f'⚠️  Error adding {col_name}: {e}')
            else:
                print(f'ℹ️  {col_name} column already exists')
        
        # Verify all columns
        cursor.execute('PRAGMA table_info(licenses)')
        final_columns = [col[1] for col in cursor.fetchall()]
        print(f'\n✅ Migration complete! Added {added_count} new columns.')
        print('Final license columns:', final_columns)
        
    except Exception as e:
        print(f'❌ Error: {e}')
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()

