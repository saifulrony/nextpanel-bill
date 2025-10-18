#!/bin/bash

# NextPanel Billing System - Development Mode Script
# This script starts the full system in development mode

# Don't exit on error - handle errors gracefully instead
# set -e  # Commented out to prevent editor from closing

# Function to cleanup on exit
cleanup() {
    echo -e "\n\n🛑 Cleaning up..."
    # Kill background processes if they exist
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo "✅ Cleanup complete. Press any key to exit..."
    read -n 1 -s
}

# Set up signal handlers to prevent abrupt termination
trap cleanup INT TERM EXIT

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
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
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

# Clean up any existing processes
print_status "Cleaning up existing processes..."

# Stop Docker containers if running
if docker-compose ps | grep -q "Up"; then
    print_warning "Stopping Docker containers..."
    docker-compose down >/dev/null 2>&1 || true
fi

# Force kill processes on ports with aggressive cleanup
print_status "Force stopping processes on ports..."
kill_port 8001  # Backend
clear_port_4000  # Frontend - aggressive cleanup
kill_port 3000  # Frontend alternative

# Additional aggressive cleanup for common process names
print_status "Force cleaning up any remaining processes..."
pkill -9 -f "uvicorn.*8001" 2>/dev/null || true

# Double-check and force kill any remaining processes
print_status "Final cleanup check..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait for processes to fully terminate
sleep 3

# Check if backend directory exists
if [ ! -d "billing-backend" ]; then
    print_error "Backend directory not found!"
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "billing-frontend" ]; then
    print_error "Frontend directory not found!"
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi

# Start Backend
print_status "Starting Backend (FastAPI) on port 8001..."
cd billing-backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_warning "Virtual environment not found, creating one..."
    if ! python3 -m venv venv; then
        print_error "Failed to create virtual environment!"
        echo "Press any key to continue or Ctrl+C to exit..."
        read -n 1 -s
        exit 1
    fi
fi

# Activate virtual environment
if ! source venv/bin/activate; then
    print_error "Failed to activate virtual environment!"
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi

# Install/update dependencies
print_status "Installing backend dependencies..."
if ! pip install -q -r requirements.txt; then
    print_error "Failed to install backend dependencies!"
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi

# Start backend in background
print_status "Starting backend server..."
if ! nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 & then
    print_error "Failed to start backend server!"
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi
BACKEND_PID=$!

# Wait for backend to start
print_status "Waiting for backend to start..."
sleep 3

# Check if backend is running
if check_port 8001; then
    print_success "Backend started successfully on port 8001 (PID: $BACKEND_PID)"
else
    print_error "Failed to start backend!"
    print_error "Check backend.log for details:"
    tail -10 ../backend.log
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi

# Go back to project root
cd ..

# Start Frontend
print_status "Starting Frontend (Next.js) on port 4000..."
cd billing-frontend

# Ensure port 4000 is completely free before starting
if lsof -ti:4000 >/dev/null 2>&1; then
    print_warning "Port 4000 still in use, clearing it again..."
    clear_port_4000
fi

# Install/update dependencies
print_status "Installing frontend dependencies..."
if ! npm install --silent; then
    print_error "Failed to install frontend dependencies!"
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi

# Start frontend in background
print_status "Starting frontend server..."
if ! nohup npm run dev -- -p 4000 -H 0.0.0.0 > ../frontend.log 2>&1 & then
    print_error "Failed to start frontend server!"
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
fi
FRONTEND_PID=$!

# Wait for frontend to start
print_status "Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if check_port 4000; then
    print_success "Frontend started successfully on port 4000 (PID: $FRONTEND_PID)"
else
    print_error "Failed to start frontend!"
    print_error "Check frontend.log for details:"
    tail -10 ../frontend.log
    echo "Press any key to continue or Ctrl+C to exit..."
    read -n 1 -s
    exit 1
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
echo "💡 Tips:"
echo "   - The system will continue running in the background"
echo "   - Use Ctrl+C to stop the system gracefully"
echo "   - Check logs with: tail -f backend.log or tail -f frontend.log"
echo ""
echo "Press any key to exit this script (the system will keep running)..."
read -n 1 -s
