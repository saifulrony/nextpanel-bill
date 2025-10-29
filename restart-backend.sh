#!/bin/bash
echo "🔄 Restarting backend container..."
docker-compose restart backend
echo "✅ Backend restarted. Waiting for it to start..."
sleep 3
echo "📋 Backend logs:"
docker-compose logs --tail=20 backend

