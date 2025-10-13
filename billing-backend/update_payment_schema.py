#!/usr/bin/env python3
"""
Update payment table schema to add new gateway-related columns
"""
import asyncio
import sqlite3
import sys

async def update_schema():
    """Add new columns to payments table"""
    db_path = "billing.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Updating payments table schema...")
        
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(payments)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        
        new_columns = {
            'gateway_id': 'VARCHAR(36)',
            'gateway_transaction_id': 'VARCHAR(255)',
            'gateway_response': 'JSON',
            'failure_reason': 'TEXT'
        }
        
        for column_name, column_type in new_columns.items():
            if column_name not in existing_columns:
                try:
                    sql = f"ALTER TABLE payments ADD COLUMN {column_name} {column_type}"
                    cursor.execute(sql)
                    print(f"  ✅ Added column: {column_name}")
                except sqlite3.OperationalError as e:
                    if "duplicate column name" not in str(e).lower():
                        print(f"  ❌ Error adding {column_name}: {e}")
            else:
                print(f"  ℹ️  Column already exists: {column_name}")
        
        # Check if payment_gateways table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='payment_gateways'")
        if not cursor.fetchone():
            print("\n🔧 Creating payment_gateways table...")
            cursor.execute("""
                CREATE TABLE payment_gateways (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    display_name VARCHAR(100) NOT NULL,
                    description TEXT,
                    status VARCHAR(20) DEFAULT 'INACTIVE',
                    is_default BOOLEAN DEFAULT 0,
                    config JSON,
                    supports_recurring BOOLEAN DEFAULT 0,
                    supports_refunds BOOLEAN DEFAULT 1,
                    supports_partial_refunds BOOLEAN DEFAULT 1,
                    supports_webhooks BOOLEAN DEFAULT 1,
                    fixed_fee FLOAT DEFAULT 0.0,
                    percentage_fee FLOAT DEFAULT 0.0,
                    api_key VARCHAR(500),
                    secret_key VARCHAR(500),
                    webhook_secret VARCHAR(500),
                    is_sandbox BOOLEAN DEFAULT 1,
                    sandbox_api_key VARCHAR(500),
                    sandbox_secret_key VARCHAR(500),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME
                )
            """)
            print("  ✅ Created payment_gateways table")
        else:
            print("  ℹ️  payment_gateways table already exists")
        
        conn.commit()
        conn.close()
        
        print("\n✅ Database schema updated successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error updating schema: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(update_schema())
    sys.exit(0 if success else 1)

