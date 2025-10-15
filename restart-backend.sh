#!/bin/bash

echo "🔄 Restarting backend to create pages table..."

# Kill existing backend
sudo pkill -9 -f "uvicorn.*app.main:app"

# Wait a moment
sleep 2

# Start backend
cd /home/saiful/nextpanel-bill/billing-backend
sudo uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &

echo "✅ Backend restarted!"
echo "📊 Pages table will be created automatically"
echo "🌐 Backend running at: http://localhost:8001"

