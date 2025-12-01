#!/usr/bin/env bash

cd "$(dirname "$0")/billing-backend"

echo "Checking if port 8001 is in use..."
if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Port 8001 is already in use. Killing existing process..."
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

echo "Starting backend server..."
echo "Backend will be available at http://0.0.0.0:8001"
echo ""

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
