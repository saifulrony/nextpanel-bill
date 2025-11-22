#!/bin/bash

# Simple script to start the backend

echo "🚀 Starting Backend Server..."
echo "=============================="

cd /home/saiful/nextpanel-bill/billing-backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Kill any existing backend on port 8001
echo ""
echo "Stopping any existing backend on port 8001..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
pkill -9 -f "uvicorn.*8001" 2>/dev/null || true
sleep 2

# Start backend
echo "Starting backend on port 8001..."
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"
echo ""

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/docs | grep -q "200"; then
        echo "✅ Backend is running!"
        echo "   URL: http://localhost:8001"
        echo "   API Docs: http://localhost:8001/docs"
        echo "   Log: tail -f ../backend.log"
    else
        echo "⚠️  Backend process is running but not responding yet..."
        echo "   Check log: tail -f ../backend.log"
    fi
else
    echo "❌ Backend failed to start!"
    echo "   Check log: tail -f ../backend.log"
    tail -20 ../backend.log
    exit 1
fi
