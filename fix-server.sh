#!/bin/bash
echo "========================================="
echo "Fixing Next.js Server"
echo "========================================="

echo ""
echo "Step 1: Stopping old server..."
sudo pkill -9 -f "next dev" || true
sleep 2

echo ""
echo "Step 2: Clearing .next build folder..."
sudo rm -rf /home/saiful/nextpanel-bill/billing-frontend/.next
echo "✓ Build folder cleared"

echo ""
echo "Step 3: Starting new server..."
cd /home/saiful/nextpanel-bill/billing-frontend
npm run dev

