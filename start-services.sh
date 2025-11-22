#!/bin/bash

# Simple script to start both backend and frontend services

echo "🚀 Starting NextPanel Billing Services..."
echo "=========================================="

# Kill any existing processes on ports 8001 and 4000
echo ""
echo "Cleaning up existing processes..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start Backend
echo ""
echo "📦 Starting Backend (port 8001)..."
cd billing-backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 5

# Check backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/docs | grep -q "200"; then
    echo "   ✅ Backend is running!"
else
    echo "   ⚠️  Backend might still be starting..."
fi

# Start Frontend
echo ""
echo "🌐 Starting Frontend (port 4000)..."
cd billing-frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
cd ..

# Wait for frontend to start
echo "   Waiting for frontend to start..."
sleep 8

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000 | grep -q "200"; then
    echo "   ✅ Frontend is running!"
else
    echo "   ⚠️  Frontend might still be starting..."
fi

# Final status
echo ""
echo "=========================================="
echo "✅ Services Started!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://192.168.177.129:4000"
echo "   Backend:  http://192.168.177.129:8001"
echo "   API Docs: http://192.168.177.129:8001/docs"
echo ""
echo "📝 View logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Stop services:"
echo "   ./stop-services.sh"
echo ""

