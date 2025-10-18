#!/bin/bash

# Clear Cache and Restart with Hot Reloading
echo "🧹 Clearing cache and restarting with hot reloading..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Clear Next.js cache
echo "🗑️ Clearing Next.js cache..."
cd billing-frontend
rm -rf .next
rm -rf node_modules/.cache
cd ..

# Clear Docker cache
echo "🐳 Clearing Docker cache..."
docker system prune -f

# Restart with hot reloading
echo "🚀 Restarting with hot reloading enabled..."
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "✅ Cache cleared and restarted with hot reloading!"
echo "🌐 Frontend: http://192.168.10.203:4000"
echo "🔄 File changes will now reload instantly!"
