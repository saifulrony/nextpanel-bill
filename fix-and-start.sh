#!/bin/bash

echo "🔧 Fixing and Starting Backend..."

# Kill all uvicorn processes
echo "Stopping all backend processes..."
pkill -9 -f uvicorn 2>/dev/null
sleep 2

# Kill anything on port 8001
echo "Clearing port 8001..."
fuser -k 8001/tcp 2>/dev/null
sleep 2

# Start backend
echo "Starting backend on port 8001..."
cd /home/saiful/nextpanel-bill/billing-backend
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &

# Wait for backend to start
sleep 5

# Check if backend is running
if ps aux | grep -q "[u]vicorn.*8001"; then
    echo "✅ Backend started successfully!"
    echo "📊 Backend running at: http://localhost:8001"
    echo "📄 API docs at: http://localhost:8001/docs"
    echo ""
    echo "🎨 Page Builder: http://localhost:3000/page-builder"
    echo "📖 View pages: http://localhost:3000/dynamic-page/home"
else
    echo "❌ Backend failed to start"
    echo "Check logs: tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log"
fi

