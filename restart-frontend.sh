#!/bin/bash
echo "Stopping Next.js server..."
sudo pkill -9 -f "next dev"

echo "Clearing .next build folder..."
sudo rm -rf /home/saiful/nextpanel-bill/billing-frontend/.next

echo "Starting Next.js server..."
cd /home/saiful/nextpanel-bill/billing-frontend
npm run dev

