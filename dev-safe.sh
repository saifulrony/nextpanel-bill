#!/bin/bash

# NextPanel Billing System - Safe Development Mode Script
# This script starts the full system in development mode with better error handling

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
    echo "✅ Cleanup complete."
}

# Set up signal handlers to prevent abrupt termination
trap cleanup INT TERM EXIT

echo "🚀 Starting NextPanel Billing System in Safe Development Mode..."
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
        print_warning "Killing processes on port $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Clean up any existing processes
print_status "Cleaning up existing processes..."

# Stop Docker containers if running
if docker-compose ps | grep -q "Up"; then
    print_warning "Stopping Docker containers..."
    docker-compose down >/dev/null 2>&1 || true
fi

# Kill processes on ports
print_status "Stopping processes on ports..."
kill_port 8001  # Backend
kill_port 4000  # Frontend
kill_port 3000  # Frontend alternative

# Wait for processes to fully terminate
sleep 2

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
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
print_status "Waiting for backend to start..."
sleep 5

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

# Ensure port 4000 is free
if check_port 4000; then
    print_warning "Port 4000 still in use, clearing it..."
    kill_port 4000
    sleep 2
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
npm run dev -- -p 4000 -H 0.0.0.0 > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
print_status "Waiting for frontend to start..."
sleep 8

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
echo ""
echo "📝 View Logs:"
echo "   Backend: tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Stop System:"
echo "   Press Ctrl+C to stop both services"
echo ""
echo "💡 The system is now running. Press Ctrl+C to stop when you're done."
echo ""

# Keep the script running and wait for user to stop it
wait
