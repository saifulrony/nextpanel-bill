#!/bin/bash

# Quick restart script for billing services

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Restarting Billing Services...${NC}"
echo ""

# Kill existing processes
echo -e "${YELLOW}Stopping services...${NC}"
pkill -f "uvicorn app.main:app --host 0.0.0.0 --port 8001" 2>/dev/null || true
fuser -k 8001/tcp 2>/dev/null || true
sleep 2

# Start backend
echo -e "${GREEN}Starting backend on port 8001...${NC}"
cd /home/saiful/nextPanel/billing/billing-backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
sleep 3

# Check if backend is running
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "  ✓ Backend is ${GREEN}RUNNING${NC}"
else
    echo -e "  ✗ Backend ${RED}FAILED${NC} to start. Check backend.log"
    tail -20 backend.log
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Backend restarted successfully!${NC}"
echo ""
echo -e "${YELLOW}Access Points:${NC}"
echo -e "  Frontend: ${GREEN}http://192.168.10.203:3002${NC}"
echo -e "  Backend:  ${GREEN}http://192.168.10.203:8001${NC}"
echo -e "  API Docs: ${GREEN}http://192.168.10.203:8001/docs${NC}"
echo ""

