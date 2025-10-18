#!/bin/bash

# Hot Development Script - Instant Updates Without Restart
echo "🔥 Starting Hot Development Mode..."
echo "This will give you instant updates without cache clearing or restarts"
echo ""

# Kill any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Clean up any hanging processes
docker system prune -f

# Start with hot reloading enabled
echo "🚀 Starting development with hot reloading..."
echo "📁 Watching for file changes..."
echo "🔄 Auto-reload enabled - changes will appear instantly"
echo ""

# Start the development environment
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "✅ Development environment started!"
echo "🌐 Frontend: http://192.168.10.203:4000"
echo "🔧 Backend: http://192.168.10.203:8001"
echo ""
echo "💡 Tips:"
echo "   - Changes to React components will reload instantly"
echo "   - Changes to CSS will hot-reload without page refresh"
echo "   - Backend changes will auto-restart the server"
echo "   - No need to clear cache or restart manually!"
