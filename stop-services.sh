#!/bin/bash

# Simple script to stop both backend and frontend services

echo "🛑 Stopping NextPanel Billing Services..."
echo "=========================================="

# Kill processes on ports
echo ""
echo "Stopping backend (port 8001)..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
pkill -f "uvicorn.*8001" 2>/dev/null || true

echo "Stopping frontend (port 4000)..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
pkill -f "next.*4000" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

sleep 2

echo ""
echo "✅ Services stopped!"
echo ""

