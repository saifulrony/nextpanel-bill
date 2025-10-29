#!/bin/bash

echo "🔧 Fixing payments table - adding order_id column..."

# Find the database file
DB_FILE="billing-backend/billing.db"

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database file not found at $DB_FILE"
    exit 1
fi

# Use sqlite3 to add the column
sqlite3 "$DB_FILE" <<EOF
PRAGMA table_info(payments);
SELECT '---' as separator;
ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id);
SELECT '✅ Column added successfully' as result;
PRAGMA table_info(payments);
EOF

echo ""
echo "✅ Migration complete!"
echo "🔄 Please restart the backend to apply changes"
