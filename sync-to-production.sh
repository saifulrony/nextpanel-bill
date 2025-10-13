#!/bin/bash

echo "🔄 Syncing Updated Files to Production"
echo "======================================="

SOURCE="/home/saiful/nextpanel-bill"
TARGET="/nextpanel/billing"

# Stop services
echo "Stopping services..."
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2
echo "✅ Services stopped"

# Sync frontend files
echo ""
echo "Syncing frontend files..."
sudo cp $SOURCE/billing-frontend/package.json $TARGET/billing-frontend/package.json
sudo cp $SOURCE/billing-frontend/src/lib/api.ts $TARGET/billing-frontend/src/lib/api.ts
sudo cp $SOURCE/billing-frontend/src/app/page.tsx $TARGET/billing-frontend/src/app/page.tsx
sudo cp $SOURCE/billing-frontend/src/app/layout.tsx $TARGET/billing-frontend/src/app/layout.tsx
sudo cp $SOURCE/billing-frontend/src/app/shop/page.tsx $TARGET/billing-frontend/src/app/shop/page.tsx
sudo cp $SOURCE/billing-frontend/src/app/cart/page.tsx $TARGET/billing-frontend/src/app/cart/page.tsx
sudo cp $SOURCE/billing-frontend/src/app/checkout/page.tsx $TARGET/billing-frontend/src/app/checkout/page.tsx
sudo cp $SOURCE/billing-frontend/src/contexts/CartContext.tsx $TARGET/billing-frontend/src/contexts/CartContext.tsx
sudo cp -r $SOURCE/billing-frontend/src/app/\(dashboard\)/* $TARGET/billing-frontend/src/app/\(dashboard\)/
echo "✅ Frontend files synced"

# Sync backend files
echo ""
echo "Syncing backend files..."
sudo cp $SOURCE/billing-backend/app/models/__init__.py $TARGET/billing-backend/app/models/__init__.py
sudo cp $SOURCE/billing-backend/app/schemas/__init__.py $TARGET/billing-backend/app/schemas/__init__.py
sudo cp $SOURCE/billing-backend/app/api/v1/plans.py $TARGET/billing-backend/app/api/v1/plans.py
sudo cp $SOURCE/billing-backend/fix_database.py $TARGET/billing-backend/fix_database.py
echo "✅ Backend files synced"

# Fix database
echo ""
echo "Updating database..."
cd $TARGET/billing-backend
python3 fix_database.py
echo "✅ Database updated"

# Clean caches
echo ""
echo "Cleaning caches..."
sudo rm -rf $TARGET/billing-frontend/.next
sudo rm -rf $TARGET/billing-frontend/node_modules/.cache
echo "✅ Caches cleaned"

echo ""
echo "======================================="
echo "✅ Sync Complete!"
echo ""
echo "NOW RUN:"
echo "  ./start.sh"
echo ""
echo "Then in browser:"
echo "  Visit: http://192.168.10.203:4000/"
echo "  Hard refresh: Ctrl + Shift + R"
echo ""

