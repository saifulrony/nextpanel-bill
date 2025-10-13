#!/bin/bash

echo "🔄 Complete System Restart"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Stop backend
echo -e "${BLUE}Step 1: Stopping backend...${NC}"
sudo kill 49367 2>/dev/null || echo "Backend already stopped"
sleep 2
echo -e "${GREEN}✅ Backend stopped${NC}"
echo ""

# Step 2: Run database migration
echo -e "${BLUE}Step 2: Adding database columns...${NC}"
cd /home/saiful/nextpanel-bill/billing-backend

if [ -f "billing.db" ]; then
    sqlite3 billing.db "ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0;" 2>/dev/null && echo -e "${GREEN}✅ Added is_featured column${NC}" || echo "ℹ️  is_featured column already exists"
    sqlite3 billing.db "ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0;" 2>/dev/null && echo -e "${GREEN}✅ Added sort_order column${NC}" || echo "ℹ️  sort_order column already exists"
else
    echo -e "${RED}❌ Database file not found!${NC}"
    exit 1
fi
echo ""

# Step 3: Restart backend
echo -e "${BLUE}Step 3: Starting backend on port 8000...${NC}"
cd /home/saiful/nextpanel-bill/billing-backend
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Failed to start backend${NC}"
    echo "Check logs: tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log"
    exit 1
fi
echo ""

# Step 4: Test backend
echo -e "${BLUE}Step 4: Testing backend API...${NC}"
sleep 2
if curl -s http://localhost:8000/api/v1/plans > /dev/null; then
    echo -e "${GREEN}✅ Backend API responding${NC}"
else
    echo -e "${RED}❌ Backend not responding${NC}"
    echo "Check logs: tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log"
fi
echo ""

# Step 5: Instructions for frontend
echo -e "${BLUE}Step 5: Frontend restart needed${NC}"
echo "Please restart your frontend manually:"
echo ""
echo "  1. In the terminal running 'npm run dev', press Ctrl+C"
echo "  2. Then run: cd /home/saiful/nextpanel-bill/billing-frontend && npm run dev"
echo "  3. Hard refresh browser: Ctrl + Shift + R"
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ Backend restarted successfully!${NC}"
echo ""
echo "Services:"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000 (restart manually)"
echo ""
echo "Next steps:"
echo "  1. Restart frontend (see instructions above)"
echo "  2. Hard refresh browser (Ctrl + Shift + R)"
echo "  3. Go to /dashboard/products"
echo "  4. Click ⭐ star to feature products"
echo "  5. Visit homepage to see featured products!"
echo ""
echo "Logs:"
echo "  Backend: tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log"
echo ""

