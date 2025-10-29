#!/bin/bash

echo "🔧 Fixing payments table..."

# Use docker exec to run sqlite3 inside the backend container
echo "Adding order_id column to payments table..."
docker exec billing-backend sqlite3 /app/billing.db <<EOF
ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id);
SELECT '✅ Column added successfully' as result;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database fixed successfully!"
else
    echo "⚠️  Column might already exist (this is OK)"
fi

echo ""
echo "🔄 Restarting backend..."
docker-compose restart backend

echo ""
echo "⏳ Waiting for backend to restart..."
sleep 5

echo ""
echo "📋 Backend status:"
docker-compose ps backend

echo ""
echo "✅ Done! Try accessing /admin/customers now"
