#!/bin/bash

# NextPanel Billing - Unified Startup Script
# Starts both backend (port 8001) and frontend (port 4000)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Use current directory instead of hardcoded path
INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCK_FILE="$INSTALL_DIR/.start.lock"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}NextPanel Billing - Starting Services${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "${YELLOW}Working directory: ${INSTALL_DIR}${NC}"
echo ""

# Check if script is already running
if [ -f "$LOCK_FILE" ]; then
    echo -e "${RED}Error: Script is already running or didn't exit cleanly${NC}"
    echo -e "${YELLOW}If you're sure no other instance is running:${NC}"
    echo -e "  rm $LOCK_FILE"
    exit 1
fi

# Create lock file
touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# Verify directories exist
if [ ! -d "$INSTALL_DIR/billing-backend" ] || [ ! -d "$INSTALL_DIR/billing-frontend" ]; then
    echo -e "${RED}Error: Required directories not found!${NC}"
    echo -e "${YELLOW}Make sure you have:${NC}"
    echo -e "  - $INSTALL_DIR/billing-backend"
    echo -e "  - $INSTALL_DIR/billing-frontend"
    exit 1
fi

# Check if services are already running
BACKEND_RUNNING=$(ps aux | grep "uvicorn app.main:app" | grep -v grep | wc -l)
FRONTEND_RUNNING=$(ps aux | grep "next dev" | grep -v grep | wc -l)

if [ "$BACKEND_RUNNING" -gt 0 ] || [ "$FRONTEND_RUNNING" -gt 0 ]; then
    echo -e "${YELLOW}Services already running. Stopping them first...${NC}"
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    sleep 3
    echo -e "  ✓ Existing services stopped"
else
    echo -e "${GREEN}No existing services found${NC}"
fi
echo ""

# Start Backend
echo -e "${GREEN}Starting Backend (port 8001)...${NC}"
cd $INSTALL_DIR/billing-backend
if [ -f "backend.log" ]; then
    mv -f backend.log backend.log.old
fi

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Use uvicorn from user's local bin if available
if [ -f "$HOME/.local/bin/uvicorn" ]; then
    nohup $HOME/.local/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
else
    nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
fi
BACKEND_PID=$!
echo -e "  Backend PID: ${GREEN}$BACKEND_PID${NC}"

# Wait and check backend
sleep 3
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "  ✓ Backend is ${GREEN}running${NC}"
else
    echo -e "  ⚠ Backend may still be starting..."
fi
echo ""

# Start Frontend
echo -e "${GREEN}Starting Frontend (port 4000)...${NC}"
cd $INSTALL_DIR/billing-frontend
if [ -f "frontend.log" ]; then
    mv -f frontend.log frontend.log.old
fi

nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "  Frontend PID: ${GREEN}$FRONTEND_PID${NC}"
echo -e "  ⏳ Waiting for Next.js to compile (20-30 seconds)..."
echo ""

# Wait for frontend
sleep 10
if curl -s http://localhost:4000 > /dev/null 2>&1; then
    echo -e "  ✓ Frontend is ${GREEN}running${NC}"
else
    echo -e "  ⚠ Frontend is still compiling..."
fi

echo ""
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}✅ Services Started Successfully!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "${YELLOW}Access Points:${NC}"
echo -e "  Frontend (local):   ${GREEN}http://localhost:4000${NC}"
NETWORK_IP=$(hostname -I | awk '{print $1}')
echo -e "  Frontend (network): ${GREEN}http://${NETWORK_IP}:4000${NC}"
echo -e "  Backend:            ${GREEN}http://localhost:8001${NC}"
echo -e "  API Docs:           ${GREEN}http://localhost:8001/docs${NC}"
echo ""
echo -e "${YELLOW}Features:${NC}"
echo -e "  ⭐ Featured Products (mark in dashboard)"
echo -e "  🛒 Shopping Cart & Checkout"
echo -e "  📦 Browse by Category"
echo -e "  🔐 Login: admin@test.com / Admin123!"
echo ""
echo -e "${YELLOW}View Logs:${NC}"
echo -e "  Backend:  ${BLUE}tail -f $INSTALL_DIR/billing-backend/backend.log${NC}"
echo -e "  Frontend: ${BLUE}tail -f $INSTALL_DIR/billing-frontend/frontend.log${NC}"
echo ""
echo -e "${YELLOW}Stop Services:${NC}"
echo -e "  ${BLUE}pkill -f 'uvicorn app.main:app'${NC}"
echo -e "  ${BLUE}pkill -f 'next dev'${NC}"
echo ""
echo -e "${YELLOW}Working from:${NC} ${GREEN}$INSTALL_DIR${NC}"
echo ""
