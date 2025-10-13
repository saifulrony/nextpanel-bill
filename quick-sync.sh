#!/bin/bash

echo "🚀 Quick Sync - Updating Production Installation"
echo "================================================"

SOURCE="/home/saiful/nextpanel-bill"
TARGET="/nextpanel/billing"

# Stop everything
echo "1. Stopping all services..."
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2
echo "   ✅ Stopped"

# Sync critical files
echo ""
echo "2. Syncing updated files..."

# Frontend - Core files
sudo cp -f $SOURCE/billing-frontend/package.json $TARGET/billing-frontend/
sudo cp -f $SOURCE/billing-frontend/src/lib/api.ts $TARGET/billing-frontend/src/lib/
sudo cp -f $SOURCE/billing-frontend/src/app/layout.tsx $TARGET/billing-frontend/src/app/
sudo cp -f $SOURCE/billing-frontend/src/app/page.tsx $TARGET/billing-frontend/src/app/

# Frontend - Auth pages
sudo mkdir -p $TARGET/billing-frontend/src/app/\(auth\)/login
sudo cp -f $SOURCE/billing-frontend/src/app/\(auth\)/login/page.tsx $TARGET/billing-frontend/src/app/\(auth\)/login/

# Frontend - New pages
sudo mkdir -p $TARGET/billing-frontend/src/app/shop
sudo mkdir -p $TARGET/billing-frontend/src/app/cart
sudo mkdir -p $TARGET/billing-frontend/src/app/checkout
sudo cp -f $SOURCE/billing-frontend/src/app/shop/page.tsx $TARGET/billing-frontend/src/app/shop/ 2>/dev/null || true
sudo cp -f $SOURCE/billing-frontend/src/app/cart/page.tsx $TARGET/billing-frontend/src/app/cart/ 2>/dev/null || true
sudo cp -f $SOURCE/billing-frontend/src/app/checkout/page.tsx $TARGET/billing-frontend/src/app/checkout/ 2>/dev/null || true

# Frontend - Contexts
sudo mkdir -p $TARGET/billing-frontend/src/contexts
sudo cp -f $SOURCE/billing-frontend/src/contexts/CartContext.tsx $TARGET/billing-frontend/src/contexts/ 2>/dev/null || true

# Frontend - Dashboard pages
sudo cp -f $SOURCE/billing-frontend/src/app/\(dashboard\)/layout.tsx $TARGET/billing-frontend/src/app/\(dashboard\)/
sudo cp -f $SOURCE/billing-frontend/src/app/\(dashboard\)/products/page.tsx $TARGET/billing-frontend/src/app/\(dashboard\)/products/

# Backend files
sudo cp -f $SOURCE/billing-backend/app/models/__init__.py $TARGET/billing-backend/app/models/
sudo cp -f $SOURCE/billing-backend/app/schemas/__init__.py $TARGET/billing-backend/app/schemas/
sudo cp -f $SOURCE/billing-backend/app/api/v1/plans.py $TARGET/billing-backend/app/api/v1/
sudo cp -f $SOURCE/billing-backend/fix_database.py $TARGET/billing-backend/ 2>/dev/null || true

echo "   ✅ Files synced"

# Update database
echo ""
echo "3. Updating database..."
cd $TARGET/billing-backend
python3 fix_database.py 2>&1 | grep -E "✅|ℹ️|❌"
echo "   ✅ Database ready"

# Clean caches
echo ""
echo "4. Cleaning caches..."
sudo rm -rf $TARGET/billing-frontend/.next
sudo rm -rf $TARGET/billing-frontend/node_modules/.cache
echo "   ✅ Caches cleaned"

echo ""
echo "================================================"
echo "✅ SYNC COMPLETE!"
echo "================================================"
echo ""
echo "NOW RUN THIS:"
echo "  ./start.sh"
echo ""
echo "THEN IN BROWSER:"
echo "  Visit: http://192.168.10.203:4000/"
echo "  Hard refresh: Ctrl + Shift + R"
echo ""
echo "Login will be prefilled with:"
echo "  Email: admin@test.com"
echo "  Password: Admin123!"
echo ""

