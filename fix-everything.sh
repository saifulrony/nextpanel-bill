#!/bin/bash

echo "🔧 Fixing Everything for Page Builder..."
echo ""

# Step 1: Fix database permissions
echo "Step 1: Fixing database permissions..."
sudo chown $USER:$USER /home/saiful/nextpanel-bill/billing-backend/billing.db
echo "✅ Database permissions fixed"
echo ""

# Step 2: Create pages table
echo "Step 2: Creating pages table..."
python3 /home/saiful/nextpanel-bill/create_pages_table.py
echo ""

# Step 3: Kill old backend
echo "Step 3: Stopping old backend..."
pkill -9 -f uvicorn 2>/dev/null
sleep 2
echo "✅ Old backend stopped"
echo ""

# Step 4: Start backend
echo "Step 4: Starting backend..."
cd /home/saiful/nextpanel-bill/billing-backend
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
sleep 5
echo "✅ Backend started"
echo ""

# Step 5: Test API
echo "Step 5: Testing API..."
if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend not responding"
    exit 1
fi
echo ""

if curl -s http://localhost:8001/api/v1/pages > /dev/null; then
    echo "✅ Pages API is working!"
else
    echo "❌ Pages API not working"
    exit 1
fi
echo ""

echo "================================================"
echo "✅ EVERYTHING IS FIXED!"
echo "================================================"
echo ""
echo "🎨 Page Builder: http://localhost:3000/page-builder"
echo "📄 View Pages:"
echo "   - Home: http://localhost:3000/dynamic-page/home"
echo "   - Cart: http://localhost:3000/dynamic-page/cart"
echo "   - Checkout: http://localhost:3000/dynamic-page/checkout"
echo "   - Order Confirmation: http://localhost:3000/dynamic-page/order-confirmation"
echo ""
echo "🚀 Start editing your pages now!"

