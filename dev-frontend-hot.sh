#!/bin/bash

# Quick Frontend Hot Reload Script
echo "🔥 Restarting Frontend with Hot Reloading..."

# Stop only the frontend container
docker-compose -f docker-compose.dev.yml stop frontend

# Remove the frontend container to ensure clean restart
docker-compose -f docker-compose.dev.yml rm -f frontend

# Start only the frontend with hot reloading
echo "🚀 Starting frontend with hot reloading enabled..."
docker-compose -f docker-compose.dev.yml up frontend --build

echo ""
echo "✅ Frontend restarted with hot reloading!"
echo "🌐 Access at: http://192.168.10.203:4000"
echo "🔄 File changes will now reload instantly!"
