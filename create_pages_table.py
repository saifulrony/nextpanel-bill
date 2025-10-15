#!/usr/bin/env python3
"""Create pages table in the database"""
import sqlite3
import os

# Database path
db_path = '/home/saiful/nextpanel-bill/billing-backend/billing.db'

print("🔧 Creating pages table...")

try:
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create pages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pages (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            components TEXT NOT NULL DEFAULT '[]',
            page_metadata TEXT DEFAULT '{}',
            is_active TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_pages_is_active ON pages(is_active)')
    
    # Insert default pages
    default_pages = [
        ('1', 'home', 'Home Page', 'Main landing page', '[]', 'active'),
        ('2', 'cart', 'Cart Page', 'Shopping cart page', '[]', 'active'),
        ('3', 'checkout', 'Checkout Page', 'Order checkout page', '[]', 'active'),
        ('4', 'order-confirmation', 'Order Confirmation', 'Order confirmation page', '[]', 'active'),
    ]
    
    cursor.executemany('''
        INSERT OR IGNORE INTO pages (id, slug, title, description, components, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', default_pages)
    
    # Commit changes
    conn.commit()
    
    print("✅ Pages table created successfully!")
    print("✅ Default pages inserted!")
    
    # Verify
    cursor.execute('SELECT COUNT(*) FROM pages')
    count = cursor.fetchone()[0]
    print(f"✅ Total pages in database: {count}")
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"❌ Error: {e}")
    exit(1)

