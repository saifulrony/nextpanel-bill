#!/bin/bash

# NextPanel Billing - Stop Services Script

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}NextPanel Billing - Stopping Services${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Get script directory
INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"

# Remove lock file if exists
if [ -f "$INSTALL_DIR/.start.lock" ]; then
    rm -f "$INSTALL_DIR/.start.lock"
    echo -e "${GREEN}✓ Removed lock file${NC}"
fi

# Stop backend
BACKEND_COUNT=$(ps aux | grep "uvicorn app.main:app" | grep -v grep | wc -l)
if [ "$BACKEND_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}Stopping backend...${NC}"
    sudo pkill -f "uvicorn app.main:app" 2>/dev/null || pkill -f "uvicorn app.main:app" 2>/dev/null
    sleep 2
    echo -e "${GREEN}✓ Backend stopped${NC}"
else
    echo -e "${GREEN}✓ Backend not running${NC}"
fi

# Stop frontend
FRONTEND_COUNT=$(ps aux | grep "next dev" | grep -v grep | wc -l)
if [ "$FRONTEND_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}Stopping frontend...${NC}"
    sudo pkill -f "next dev" 2>/dev/null || pkill -f "next dev" 2>/dev/null
    sleep 2
    echo -e "${GREEN}✓ Frontend stopped${NC}"
else
    echo -e "${GREEN}✓ Frontend not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

