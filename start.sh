#!/bin/bash

# NextPanel Billing - Unified Startup Script
# Starts both backend (port 8001) and frontend (port 3001)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/nextpanel/billing"

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}NextPanel Billing - Starting Services${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Check if installation exists
if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${RED}Error: Installation not found at $INSTALL_DIR${NC}"
    echo -e "${YELLOW}Please run: sudo ./setup_clean_installation.sh first${NC}"
    exit 1
fi

# Stop any existing processes
echo -e "${YELLOW}Stopping any existing services...${NC}"
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
fuser -k 8001/tcp 2>/dev/null || true
fuser -k 4000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true
sleep 2
echo -e "  ✓ Existing services stopped"
echo ""

# Start Backend
echo -e "${GREEN}Starting Backend (port 8001)...${NC}"
cd $INSTALL_DIR/billing-backend
if [ -f "backend.log" ]; then
    mv backend.log backend.log.old
fi

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
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
    mv frontend.log frontend.log.old
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
echo -e "  Frontend (network): ${GREEN}http://192.168.10.203:4000${NC}"
echo -e "  Backend:            ${GREEN}http://localhost:8001${NC}"
echo -e "  API Docs:           ${GREEN}http://localhost:8001/docs${NC}"
echo ""
echo -e "${YELLOW}View Logs:${NC}"
echo -e "  Backend:  ${BLUE}tail -f $INSTALL_DIR/billing-backend/backend.log${NC}"
echo -e "  Frontend: ${BLUE}tail -f $INSTALL_DIR/billing-frontend/frontend.log${NC}"
echo ""
echo -e "${YELLOW}Stop Services:${NC}"
echo -e "  ${BLUE}pkill -f 'uvicorn app.main:app'${NC}"
echo -e "  ${BLUE}pkill -f 'next dev'${NC}"
echo ""
echo -e "${YELLOW}Installation Location:${NC} ${GREEN}$INSTALL_DIR${NC}"
echo ""
