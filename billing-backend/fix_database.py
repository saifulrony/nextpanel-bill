#!/usr/bin/env python3
"""
Quick database fix - adds missing columns
"""
import sqlite3
import sys

print("🔧 Fixing database...")

try:
    # Connect to database
    conn = sqlite3.connect('billing.db')
    cursor = conn.cursor()
    
    # Check existing columns
    cursor.execute("PRAGMA table_info(plans);")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Existing columns: {', '.join(columns)}")
    
    # Add is_featured if missing
    if 'is_featured' not in columns:
        print("\nAdding is_featured column...")
        cursor.execute("ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0")
        conn.commit()
        print("✅ Added is_featured")
    else:
        print("\nℹ️  is_featured already exists")
    
    # Add sort_order if missing
    if 'sort_order' not in columns:
        print("Adding sort_order column...")
        cursor.execute("ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0")
        conn.commit()
        print("✅ Added sort_order")
    else:
        print("ℹ️  sort_order already exists")
    
    # Verify
    cursor.execute("PRAGMA table_info(plans);")
    new_columns = [row[1] for row in cursor.fetchall()]
    
    if 'is_featured' in new_columns and 'sort_order' in new_columns:
        print("\n✅ Database updated successfully!")
        print("\nNew columns confirmed:")
        for col in ['is_featured', 'sort_order']:
            if col in new_columns:
                print(f"  ✓ {col}")
    
    conn.close()
    print("\n🎉 All done! Restart your backend now.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)

