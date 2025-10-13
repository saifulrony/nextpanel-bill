#!/bin/bash

echo "🔄 Updating database schema for featured products..."

cd /home/saiful/nextpanel-bill/billing-backend

# Find and stop the backend process
echo "Stopping backend server..."
BACKEND_PID=$(ps aux | grep "uvicorn app.main:app" | grep -v grep | awk '{print $2}')

if [ ! -z "$BACKEND_PID" ]; then
    echo "Found backend process: $BACKEND_PID"
    kill $BACKEND_PID 2>/dev/null || sudo kill $BACKEND_PID
    sleep 2
    echo "✅ Backend stopped"
else
    echo "ℹ️  Backend not running"
fi

# Run SQL migration
echo ""
echo "Adding database columns..."
if [ -f "billing.db" ]; then
    sqlite3 billing.db "ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0;" 2>/dev/null && echo "✅ Added is_featured column" || echo "ℹ️  is_featured column may already exist"
    sqlite3 billing.db "ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0;" 2>/dev/null && echo "✅ Added sort_order column" || echo "ℹ️  sort_order column may already exist"
else
    echo "❌ Database file not found!"
    exit 1
fi

# Restart backend
echo ""
echo "Starting backend server..."
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
NEW_PID=$!
sleep 3

# Check if it started
if ps -p $NEW_PID > /dev/null; then
    echo "✅ Backend started successfully (PID: $NEW_PID)"
    echo "📋 Logs: tail -f backend.log"
else
    echo "❌ Failed to start backend"
    echo "Check logs: cat backend.log"
    exit 1
fi

echo ""
echo "✅ Update complete!"
echo ""
echo "Next steps:"
echo "1. Go to http://localhost:3000/dashboard/products"
echo "2. Click the ⭐ star icon on products you want to feature"
echo "3. Visit http://localhost:3000/ to see them on homepage"

