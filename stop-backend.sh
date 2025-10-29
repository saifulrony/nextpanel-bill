#!/bin/bash
# Make this file executable with: chmod +x stop-backend.sh

echo "Stopping backend server on port 8001..."

if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "Found process on port 8001. Killing it..."
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    echo "Backend server stopped."
else
    echo "No process found on port 8001."
fi
