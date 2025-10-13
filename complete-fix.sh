#!/bin/bash

echo "🔧 COMPLETE FIX - Frontend + Backend"
echo "====================================="
echo ""

# Kill ALL processes
echo "Step 1: Stopping all processes..."
sudo pkill -9 -f "uvicorn app.main" 2>/dev/null || true
sudo pkill -9 -f "next dev" 2>/dev/null || true
sudo pkill -9 -f "node.*next" 2>/dev/null || true
sleep 3
echo "✅ All processes stopped"

# Fix database
echo ""
echo "Step 2: Updating database..."
cd /home/saiful/nextpanel-bill/billing-backend
python3 fix_database.py
echo "✅ Database updated"

# Clean frontend
echo ""
echo "Step 3: Cleaning frontend..."
cd /home/saiful/nextpanel-bill/billing-frontend
sudo rm -rf .next
sudo rm -rf node_modules/.cache
sudo chown -R saiful:saiful /home/saiful/nextpanel-bill/billing-frontend
echo "✅ Frontend cleaned"

echo ""
echo "====================================="
echo "✅ Cleanup complete!"
echo ""
echo "NOW DO THIS IN ORDER:"
echo ""
echo "TERMINAL 1 - Backend:"
echo "  cd /home/saiful/nextpanel-bill/billing-backend"
echo "  python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "TERMINAL 2 - Frontend:"
echo "  cd /home/saiful/nextpanel-bill/billing-frontend"
echo "  npm run dev"
echo ""
echo "BROWSER:"
echo "  Hard refresh: Ctrl + Shift + R"
echo "  Visit: http://localhost:4000/"
echo ""
echo "Note: Frontend runs on PORT 4000"
echo ""

