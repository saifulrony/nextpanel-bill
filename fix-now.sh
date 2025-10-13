#!/bin/bash

echo "🔧 Quick Fix for Network Errors"
echo "================================"

# Kill stuck backend
echo "Stopping stuck backend process..."
sudo kill -9 49367 2>/dev/null
sleep 2
echo "✅ Stopped old backend"

# Add database columns
echo ""
echo "Adding database columns..."
cd /home/saiful/nextpanel-bill/billing-backend
sqlite3 billing.db "ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0;" 2>/dev/null && echo "✅ Added is_featured" || echo "ℹ️  is_featured exists"
sqlite3 billing.db "ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0;" 2>/dev/null && echo "✅ Added sort_order" || echo "ℹ️  sort_order exists"

# Start backend fresh
echo ""
echo "Starting backend on port 8000..."
cd /home/saiful/nextpanel-bill/billing-backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
NEW_PID=$!
echo "Backend starting (PID: $NEW_PID)..."
sleep 5

# Test it
echo ""
echo "Testing backend..."
if curl -s http://localhost:8000/api/v1/plans > /dev/null 2>&1; then
    echo "✅ Backend working!"
    echo ""
    echo "================================"
    echo "SUCCESS! Backend is running."
    echo ""
    echo "NOW DO THIS:"
    echo "1. In your frontend terminal, press Ctrl+C"
    echo "2. Run: npm run dev"
    echo "3. In browser, hard refresh: Ctrl+Shift+R"
    echo "4. Visit: http://localhost:3000/dashboard/products"
    echo ""
    echo "Logs: tail -f backend.log"
else
    echo "❌ Backend not responding"
    echo "Check logs: tail -f backend.log"
fi

