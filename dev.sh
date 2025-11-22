#!/bin/bash

# NextPanel Billing System - Development Mode Script
# This script starts the full system in development mode
# It automatically starts both backend and frontend services

# Exit on error for critical failures, but allow unbound variables in cleanup
set -eo pipefail

# Initialize variables
BACKEND_PID=""
FRONTEND_PID=""
CLEANUP_ON_EXIT=false

# Function to cleanup on error/interrupt (not on successful exit)
cleanup_on_error() {
    if [ "$CLEANUP_ON_EXIT" = true ]; then
        echo -e "\n\n🛑 Cleaning up due to error/interrupt..."
        # Kill background processes if they exist
        if [ ! -z "${BACKEND_PID:-}" ]; then
            kill ${BACKEND_PID} 2>/dev/null || true
        fi
        if [ ! -z "${FRONTEND_PID:-}" ]; then
            kill ${FRONTEND_PID} 2>/dev/null || true
        fi
        echo "✅ Cleanup complete."
    fi
}

# Function to stop services explicitly
stop_services() {
    echo -e "\n\n🛑 Stopping services..."
    # Kill processes on ports
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
    pkill -9 -f "uvicorn.*8001" 2>/dev/null || true
    pkill -9 -f "next.*4000" 2>/dev/null || true
    pkill -9 -f "npm.*dev" 2>/dev/null || true
    sleep 2
    echo "✅ Services stopped."
}

# Set up signal handlers - only cleanup on error/interrupt
trap 'CLEANUP_ON_EXIT=true; cleanup_on_error' INT TERM ERR

echo "🚀 Starting NextPanel Billing System in Development Mode..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        print_warning "Force killing processes on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
        # Double check and force kill if still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$remaining_pids" ]; then
            print_warning "Force killing remaining processes on port $port (PIDs: $remaining_pids)"
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
        # Final check
        local final_pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$final_pids" ]; then
            print_warning "Final force kill on port $port (PIDs: $final_pids)"
            echo "$final_pids" | xargs kill -9 2>/dev/null || true
        fi
    fi
}

# Function to aggressively clear port 4000
clear_port_4000() {
    print_status "Aggressively clearing port 4000..."
    
    # Method 1: Kill by port
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
    sleep 1
    
    # Method 2: Kill by process name
    pkill -9 -f "next.*4000" 2>/dev/null || true
    pkill -9 -f "npm.*dev" 2>/dev/null || true
    pkill -9 -f "node.*next" 2>/dev/null || true
    sleep 1
    
    # Method 3: Kill any node process that might be using port 4000
    ps aux | grep -E "(next|npm|node)" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
    sleep 1
    
    # Method 4: Final port check and kill
    local remaining=$(lsof -ti:4000 2>/dev/null || true)
    if [ ! -z "$remaining" ]; then
        print_warning "Final aggressive kill on port 4000 (PIDs: $remaining)"
        echo "$remaining" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # Method 5: Use fuser if available
    if command -v fuser >/dev/null 2>&1; then
        fuser -k 4000/tcp 2>/dev/null || true
        sleep 1
    fi
    
    # Final verification
    if lsof -ti:4000 >/dev/null 2>&1; then
        print_error "Port 4000 is still in use after aggressive cleanup!"
        return 1
    else
        print_success "Port 4000 is now free!"
        return 0
    fi
}

# Clean up any existing processes - AGGRESSIVE FORCE KILL
print_status "Forcefully stopping ALL existing processes..."

# Stop Docker containers if running
if docker-compose ps | grep -q "Up" 2>/dev/null; then
    print_warning "Stopping Docker containers..."
    docker-compose down >/dev/null 2>&1 || true
fi

# FORCE KILL all processes on ports 8001, 4000, 3000
print_status "Force killing processes on ports 8001, 4000, 3000..."
for port in 8001 4000 3000; do
    pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        print_warning "Killing processes on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
done

# Kill ALL processes by name (very aggressive)
print_status "Killing all processes by name..."
pkill -9 -f "uvicorn.*8001" 2>/dev/null || true
pkill -9 -f "uvicorn.*main" 2>/dev/null || true
pkill -9 -f "next.*dev" 2>/dev/null || true
pkill -9 -f "next.*4000" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "npm.*dev" 2>/dev/null || true
pkill -9 -f "node.*next" 2>/dev/null || true
pkill -9 -f "node.*4000" 2>/dev/null || true

# Use fuser to force kill anything still on the ports
print_status "Final force kill with fuser..."
for port in 8001 4000 3000; do
    if command -v fuser >/dev/null 2>&1; then
        fuser -k ${port}/tcp 2>/dev/null || true
    fi
    # Double check with lsof and kill again
    lsof -ti:${port} 2>/dev/null | xargs kill -9 2>/dev/null || true
done

# Wait for all processes to fully terminate
print_status "Waiting for processes to terminate..."
sleep 3

# Final verification - ports should be free
print_status "Verifying ports are free..."
for port in 8001 4000 3000; do
    if lsof -ti:${port} >/dev/null 2>&1; then
        print_warning "Port $port still in use, forcing kill again..."
        lsof -ti:${port} 2>/dev/null | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
done
sleep 2

# Check if backend directory exists
if [ ! -d "billing-backend" ]; then
    print_error "Backend directory not found!"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "billing-frontend" ]; then
    print_error "Frontend directory not found!"
    exit 1
fi

# Start Backend
print_status "Starting Backend (FastAPI) on port 8001..."
cd billing-backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found, creating one..."
    python3 -m venv venv || {
        print_error "Failed to create virtual environment!"
        exit 1
    }
fi

# Activate virtual environment
source venv/bin/activate || {
    print_error "Failed to activate virtual environment!"
    exit 1
}

# Install/update dependencies (only if requirements.txt exists)
if [ -f "requirements.txt" ]; then
    print_status "Installing backend dependencies..."
    pip install -q -r requirements.txt || {
        print_error "Failed to install backend dependencies!"
        exit 1
    }
fi

# Start backend in background
print_status "Starting backend server..."
# We're already in billing-backend directory from earlier checks
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for process to start
sleep 2

# Check if the process started successfully
if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
    print_error "Failed to start backend server!"
    print_error "Check backend.log for details:"
    tail -20 ../backend.log
    print_status "Attempting to diagnose the issue..."
    exit 1
fi
print_status "Backend process started (PID: $BACKEND_PID)"

# Wait for backend to start and verify it's responding
print_status "Waiting for backend to start..."
MAX_WAIT=30
WAITED=0
BACKEND_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    if check_port 8001; then
        # Check if backend is actually responding to requests
        if curl -s -f http://localhost:8001/api/v1/health >/dev/null 2>&1 || \
           curl -s -f http://localhost:8001/docs >/dev/null 2>&1 || \
           curl -s -f http://localhost:8001/ >/dev/null 2>&1; then
            print_success "Backend started successfully on port 8001 (PID: $BACKEND_PID) and is responding!"
            BACKEND_READY=true
            break
        else
            print_status "Backend port is open, waiting for it to be ready... ($WAITED/$MAX_WAIT seconds)"
        fi
    else
        print_status "Waiting for backend to start... ($WAITED/$MAX_WAIT seconds)"
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ "$BACKEND_READY" = false ]; then
    print_error "Backend did not start or become ready within $MAX_WAIT seconds!"
    print_error "Check backend.log for details:"
    tail -20 ../backend.log
    exit 1
fi

# Go back to project root
cd /home/saiful/nextpanel-bill || cd .. || {
    print_error "Failed to return to project root!"
    exit 1
}

# Start Frontend
print_status "Starting Frontend (Next.js) on port 4000..."
cd billing-frontend || {
    print_error "Failed to change to billing-frontend directory!"
    exit 1
}

# Ensure port 4000 is completely free before starting
if lsof -ti:4000 >/dev/null 2>&1; then
    print_warning "Port 4000 still in use, clearing it again..."
    clear_port_4000
fi

# Install/update dependencies (skip if node_modules exists and package.json hasn't changed recently)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install --silent || {
        print_error "Failed to install frontend dependencies!"
        exit 1
    }
else
    print_status "Frontend dependencies already installed, skipping..."
fi

# Start frontend in background with hot reloading
print_status "Starting frontend server with hot reloading..."
# We're already in billing-frontend directory
# Store project root path before changing directories
PROJECT_ROOT=$(cd .. && pwd)
print_status "Starting npm run dev..."
nohup npm run dev > "${PROJECT_ROOT}/frontend.log" 2>&1 &
NPM_PID=$!
cd "${PROJECT_ROOT}"

# Wait for npm to start the child process
sleep 3

# Find the actual next-server process (not just npm)
print_status "Looking for Next.js process..."
FRONTEND_PID=""
for i in {1..10}; do
    # Try to find next-server or node process related to next dev
    FRONTEND_PID=$(pgrep -f "next.*dev.*4000" 2>/dev/null | head -1 || pgrep -f "next-server.*4000" 2>/dev/null | head -1 || true)
    if [ ! -z "$FRONTEND_PID" ]; then
        print_status "Found Next.js process (PID: $FRONTEND_PID)"
        break
    fi
    sleep 1
done

# If we didn't find next-server, check if npm is still running
if [ -z "$FRONTEND_PID" ]; then
    if ps -p $NPM_PID > /dev/null 2>&1; then
        print_status "npm process still running (PID: $NPM_PID), waiting for Next.js to start..."
        sleep 5
        FRONTEND_PID=$(pgrep -f "next.*dev.*4000" 2>/dev/null | head -1 || pgrep -f "next-server.*4000" 2>/dev/null | head -1 || echo "$NPM_PID")
    else
        print_error "Failed to start frontend server!"
        print_error "npm process (PID: $NPM_PID) has exited"
        print_error "Check frontend.log for details:"
        tail -50 frontend.log 2>/dev/null || tail -50 "${PROJECT_ROOT}/frontend.log" 2>/dev/null || echo "Log file not found"
        exit 1
    fi
fi

print_status "Frontend process started (PID: $FRONTEND_PID)"

# Wait for frontend to start and verify it's responding
print_status "Waiting for frontend to start (this may take up to 60 seconds for first build)..."
MAX_WAIT=60
WAITED=0
FRONTEND_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    # Check if parent process or any child processes are still running
    PROCESS_RUNNING=false
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        PROCESS_RUNNING=true
    else
        # Check for child processes (next-server, node processes)
        CHILD_PROCS=$(pgrep -P $FRONTEND_PID 2>/dev/null || pgrep -f "next.*dev" 2>/dev/null || true)
        if [ ! -z "$CHILD_PROCS" ]; then
            PROCESS_RUNNING=true
            print_status "Parent process ended but child processes still running: $CHILD_PROCS"
        fi
    fi
    
    if [ "$PROCESS_RUNNING" = false ]; then
        print_error "Frontend process (PID: $FRONTEND_PID) has stopped!"
        print_error "Check frontend.log for details:"
        tail -50 frontend.log 2>/dev/null || tail -50 "${PROJECT_ROOT}/frontend.log" 2>/dev/null || echo "Log file not found"
        FRONTEND_READY=false
        break
    fi
    
    # Check if port 4000 is in use OR if we can connect to it
    PORT_IN_USE=$(lsof -ti:4000 2>/dev/null || true)
    HTTP_CODE="000"
    
    # Try to connect to frontend regardless of port check
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:4000 2>/dev/null || echo "000")
    
    if [ ! -z "$PORT_IN_USE" ] || echo "$HTTP_CODE" | grep -qE "^[23]"; then
        if echo "$HTTP_CODE" | grep -qE "^[23]"; then
            print_success "Frontend started successfully on port 4000 (PID: $FRONTEND_PID, HTTP: $HTTP_CODE) and is responding!"
            FRONTEND_READY=true
            break
        else
            print_status "Port 4000 is in use (PID: $PORT_IN_USE), waiting for it to be ready... ($WAITED/$MAX_WAIT seconds, HTTP: $HTTP_CODE)"
        fi
    else
        print_status "Waiting for frontend to start... ($WAITED/$MAX_WAIT seconds, HTTP: $HTTP_CODE)"
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

if [ "$FRONTEND_READY" = false ]; then
    # Double check if frontend is actually running
    FINAL_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://localhost:4000 2>/dev/null || echo "000")
    PORT_CHECK=$(lsof -ti:4000 2>/dev/null || echo "")
    PROCESS_CHECK=$(pgrep -f "next.*dev.*4000" 2>/dev/null | head -1 || echo "")
    
    if echo "$FINAL_CHECK" | grep -qE "^[23]" || [ ! -z "$PROCESS_CHECK" ]; then
        print_warning "Frontend appears to be running but wasn't detected during wait period"
        print_success "Frontend is responding (HTTP: $FINAL_CHECK, PID: $PROCESS_CHECK)!"
        FRONTEND_READY=true
    else
        print_error "Frontend did not start or become ready within $MAX_WAIT seconds!"
        print_error "Check frontend.log for details:"
        PROJECT_ROOT=$(pwd)
        tail -30 "${PROJECT_ROOT}/frontend.log" 2>/dev/null || tail -30 frontend.log 2>/dev/null || echo "Log file not found"
        print_error "Frontend process status:"
        ps aux | grep -E "(next|npm.*dev)" | grep -v grep | head -5
        print_error "Port 4000 status:"
        lsof -i :4000 2>/dev/null || echo "Port 4000 not in use"
        print_error "Final HTTP check: $FINAL_CHECK"
        exit 1
    fi
fi

# Go back to project root
cd ..

# Create a simple status check script
cat > check-dev-status.sh << 'EOF'
#!/bin/bash
echo "🔍 NextPanel Billing System - Development Status"
echo "=============================================="

# Check backend
if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Backend (FastAPI): Running on port 8001"
    echo "   API URL: http://localhost:8001"
    echo "   Docs: http://localhost:8001/docs"
else
    echo "❌ Backend (FastAPI): Not running"
fi

# Check frontend
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Frontend (Next.js): Running on port 4000"
    echo "   URL: http://localhost:4000"
    echo "   Admin: http://localhost:4000/admin"
    echo "   Domain Pricing: http://localhost:4000/admin/domain-pricing"
else
    echo "❌ Frontend (Next.js): Not running"
fi

echo ""
echo "📊 Process Information:"
ps aux | grep -E "(uvicorn|next)" | grep -v grep | awk '{print "   PID:", $2, "|", $11, $12, $13, $14, $15}'

echo ""
echo "📝 Log Files:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
EOF

chmod +x check-dev-status.sh

# Final status
echo ""
echo "🎉 NextPanel Billing System is now running in Development Mode!"
echo "=================================================="
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:4000"
echo "   Backend API: http://localhost:8001"
echo "   API Documentation: http://localhost:8001/docs"
echo "   Admin Dashboard: http://localhost:4000/admin"
echo "   Domain Pricing: http://localhost:4000/admin/domain-pricing"
echo ""
echo "📊 Check Status:"
echo "   Run: ./check-dev-status.sh"
echo ""
echo "📝 View Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Stop System:"
echo "   Run: ./stop-dev.sh"
echo ""

# Create stop script
cat > stop-dev.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping NextPanel Billing System..."

# Stop Docker containers if running
if docker-compose ps | grep -q "Up"; then
    echo "Stopping Docker containers..."
    docker-compose down
fi

# Kill processes by port
echo "Stopping processes on ports..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill processes by name
echo "Stopping processes by name..."
pkill -f "uvicorn.*8001" 2>/dev/null || true
pkill -f "next.*4000" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true

# Wait a moment
sleep 2

echo "✅ System stopped!"
EOF

chmod +x stop-dev.sh

# Run status check
./check-dev-status.sh

print_success "Development environment is ready! 🚀"
echo ""
echo "✅ All services started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://192.168.177.129:4000"
echo "   Backend:  http://192.168.177.129:8001"
echo "   API Docs: http://192.168.177.129:8001/docs"
echo ""
echo "📝 View logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Stop services:"
echo "   ./dev.sh  # Run again to stop old and restart"
echo "   Or manually: lsof -ti:8001 | xargs kill -9 && lsof -ti:4000 | xargs kill -9"
echo ""
echo "💡 Services are running in the background!"
echo "💡 Script will exit now. Services continue running."
echo ""
