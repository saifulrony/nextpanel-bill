#!/bin/bash

echo "🔧 Fixing Frontend Permissions & Cache"
echo "======================================"

cd /home/saiful/nextpanel-bill/billing-frontend

# Stop any running frontend
echo "Stopping frontend processes..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Remove .next with sudo (some files owned by root)
echo "Cleaning .next cache..."
sudo rm -rf .next
echo "✅ Removed .next"

# Fix ownership of entire frontend directory
echo ""
echo "Fixing file permissions..."
sudo chown -R saiful:saiful /home/saiful/nextpanel-bill/billing-frontend
echo "✅ Fixed permissions"

# Clean node_modules/.cache if it exists
echo ""
echo "Cleaning node cache..."
rm -rf node_modules/.cache 2>/dev/null || true
echo "✅ Cleaned node cache"

echo ""
echo "======================================"
echo "✅ Frontend cleaned successfully!"
echo ""
echo "NOW RUN THIS:"
echo "  npm run dev"
echo ""
echo "Then in browser:"
echo "  Ctrl + Shift + R (hard refresh)"
echo ""

