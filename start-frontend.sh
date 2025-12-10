#!/bin/bash

# Simple script to start the frontend

echo "🚀 Starting Frontend Server..."
echo "=============================="

cd /home/saiful/nextpanel-bill/billing-frontend

# Kill any existing frontend on port 4000
echo ""
echo "Stopping any existing frontend on port 4000..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
pkill -9 -f "next.*4000" 2>/dev/null || true
pkill -9 -f "npm.*dev" 2>/dev/null || true
sleep 2

# Start frontend
echo "Starting frontend on port 4000..."
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Frontend started with PID: $FRONTEND_PID"
echo ""

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 8

# Check if frontend is running
if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000 | grep -q "200"; then
        echo "✅ Frontend is running!"
        echo "   URL: http://localhost:4000"
        echo "   Network URL: http://192.168.177.129:4000"
        echo "   Log: tail -f ../frontend.log"
    else
        echo "⚠️  Frontend process is running but not responding yet..."
        echo "   Check log: tail -f ../frontend.log"
    fi
else
    echo "❌ Frontend failed to start!"
    echo "   Check log: tail -f ../frontend.log"
    tail -20 ../frontend.log
    exit 1
fi

