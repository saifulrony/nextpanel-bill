#!/bin/bash

# NextPanel Billing System - Smart Development Mode Script
# This script intelligently manages services - only starts what's needed
# Can be run multiple times safely - won't restart if already running

set -euo pipefail

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# PID file locations
PID_DIR="$PROJECT_ROOT/.dev-pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
LOCK_FILE="$PID_DIR/.lock"

# Create PID directory
mkdir -p "$PID_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Print functions
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_header() { echo -e "${CYAN}$1${NC}"; }

# Check if port is in use
check_port() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
}

# Check if service is healthy
check_backend_health() {
    curl -s -f http://localhost:8001/health >/dev/null 2>&1
}

check_frontend_health() {
    curl -s -f http://localhost:4000 >/dev/null 2>&1
}

# Get process ID from PID file
get_pid() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        cat "$pid_file" 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# Check if PID is running
is_pid_running() {
    local pid=$1
    [ -z "$pid" ] && return 1
    ps -p "$pid" >/dev/null 2>&1
}

# Find process by port
find_process_by_port() {
    local port=$1
    lsof -ti:$port 2>/dev/null | head -1 || echo ""
}

# Kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Start backend
start_backend() {
    print_status "Starting Backend (FastAPI) on port 8001..."
    cd "$PROJECT_ROOT/billing-backend"
    
    # Check venv
    if [ ! -d "venv" ]; then
        print_warning "Creating virtual environment..."
        python3 -m venv venv || {
            print_error "Failed to create venv!"
            return 1
        }
    fi
    
    # Activate venv
    source venv/bin/activate || {
        print_error "Failed to activate venv!"
        return 1
    }
    
    # Install dependencies if needed
    if [ ! -d "venv/lib" ] || [ "requirements.txt" -nt "venv/.installed" ]; then
        print_status "Installing/updating dependencies..."
        pip install -q -r requirements.txt && touch venv/.installed || {
            print_error "Failed to install dependencies!"
            return 1
        }
    fi
    
    # Rotate log
    [ -f "../backend.log" ] && mv -f ../backend.log ../backend.log.old 2>/dev/null || true
    
    # Start backend
    if [ -f "$HOME/.local/bin/uvicorn" ]; then
        nohup "$HOME/.local/bin/uvicorn" app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
    else
        nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > ../backend.log 2>&1 &
    fi
    local pid=$!
    echo "$pid" > "$BACKEND_PID_FILE"
    
    # Wait for backend to be ready
    print_status "Waiting for backend to start..."
    local waited=0
    local max_wait=30
    while [ $waited -lt $max_wait ]; do
        if check_backend_health; then
            print_success "Backend is running (PID: $pid)"
            return 0
        fi
        sleep 2
        waited=$((waited + 2))
    done
    
    print_error "Backend failed to start within $max_wait seconds"
    tail -20 ../backend.log
    return 1
}

# Start frontend
start_frontend() {
    print_status "Starting Frontend (Next.js) on port 4000..."
    cd "$PROJECT_ROOT/billing-frontend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.installed" ]; then
        print_status "Installing/updating dependencies..."
        npm install --silent && touch node_modules/.installed || {
            print_error "Failed to install dependencies!"
            return 1
        }
    fi
    
    # Rotate log
    [ -f "../frontend.log" ] && mv -f ../frontend.log ../frontend.log.old 2>/dev/null || true
    
    # Start frontend
    nohup npm run dev > ../frontend.log 2>&1 &
    local npm_pid=$!
    
    # Wait a bit for Next.js to start
    sleep 3
    
    # Find the actual Next.js process
    local frontend_pid=$(pgrep -f "next.*dev.*4000" 2>/dev/null | head -1 || echo "$npm_pid")
    echo "$frontend_pid" > "$FRONTEND_PID_FILE"
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to compile (this may take 30-60 seconds)..."
    local waited=0
    local max_wait=90
    while [ $waited -lt $max_wait ]; do
        if check_frontend_health; then
            print_success "Frontend is running (PID: $frontend_pid)"
            return 0
        fi
        sleep 3
        waited=$((waited + 3))
    done
    
    # Final check
    if check_frontend_health; then
        print_success "Frontend is running (PID: $frontend_pid)"
        return 0
    fi
    
    print_warning "Frontend may still be compiling. Check logs: tail -f frontend.log"
    return 0  # Don't fail - Next.js can take a while on first build
}

# Check and start backend if needed
ensure_backend_running() {
    local backend_pid=$(get_pid "$BACKEND_PID_FILE")
    local port_pid=$(find_process_by_port 8001)
    
    # Check if backend is already running and healthy
    if [ ! -z "$port_pid" ] && check_backend_health; then
        if [ ! -z "$backend_pid" ] && [ "$backend_pid" = "$port_pid" ]; then
            print_success "Backend already running (PID: $backend_pid)"
            return 0
        else
            # Update PID file
            echo "$port_pid" > "$BACKEND_PID_FILE"
            print_success "Backend already running (PID: $port_pid)"
            return 0
        fi
    fi
    
    # Backend not running or unhealthy - start it
    if [ ! -z "$port_pid" ]; then
        print_warning "Cleaning up old backend process on port 8001..."
        kill_port 8001
        sleep 2
    fi
    
    start_backend
}

# Check and start frontend if needed
ensure_frontend_running() {
    local frontend_pid=$(get_pid "$FRONTEND_PID_FILE")
    local port_pid=$(find_process_by_port 4000)
    
    # Check if frontend is already running and healthy
    if [ ! -z "$port_pid" ] && check_frontend_health; then
        if [ ! -z "$frontend_pid" ] && is_pid_running "$frontend_pid"; then
            print_success "Frontend already running (PID: $frontend_pid)"
            return 0
        else
            # Update PID file
            echo "$port_pid" > "$FRONTEND_PID_FILE"
            print_success "Frontend already running (PID: $port_pid)"
            return 0
        fi
    fi
    
    # Frontend not running or unhealthy - start it
    if [ ! -z "$port_pid" ]; then
        print_warning "Cleaning up old frontend process on port 4000..."
        kill_port 4000
        sleep 2
    fi
    
    start_frontend
}

# Show status
show_status() {
    echo ""
    print_header "═══════════════════════════════════════════════════════"
    print_header "  NextPanel Billing System - Development Status"
    print_header "═══════════════════════════════════════════════════════"
    echo ""
    
    # Backend status
    local backend_pid=$(get_pid "$BACKEND_PID_FILE")
    if check_backend_health; then
        local actual_pid=$(find_process_by_port 8001)
        print_success "Backend: Running (PID: ${actual_pid:-$backend_pid})"
        echo "   URL: http://localhost:8001"
        echo "   Health: http://localhost:8001/health"
        echo "   Docs: http://localhost:8001/docs"
    elif check_port 8001; then
        print_warning "Backend: Port in use but not responding"
    else
        print_error "Backend: Not running"
    fi
    
    echo ""
    
    # Frontend status
    local frontend_pid=$(get_pid "$FRONTEND_PID_FILE")
    if check_frontend_health; then
        local actual_pid=$(find_process_by_port 4000)
        print_success "Frontend: Running (PID: ${actual_pid:-$frontend_pid})"
        echo "   URL: http://localhost:4000"
        NETWORK_IP=$(hostname -I | awk '{print $1}')
        echo "   Network: http://${NETWORK_IP}:4000"
    elif check_port 4000; then
        print_warning "Frontend: Port in use but not responding (may be compiling)"
    else
        print_error "Frontend: Not running"
    fi
    
    echo ""
    print_header "═══════════════════════════════════════════════════════"
    echo ""
}

# Main execution
main() {
    # Handle command line arguments
    case "${1:-start}" in
        start|"")
            print_header "🚀 NextPanel Billing - Smart Development Mode"
            echo ""
            
            # Check directories
            if [ ! -d "billing-backend" ] || [ ! -d "billing-frontend" ]; then
                print_error "Required directories not found!"
                exit 1
            fi
            
            # Ensure services are running
            ensure_backend_running
            ensure_frontend_running
            
            # Show status
            show_status
            
            print_success "All services are running!"
            echo ""
            echo "💡 Tips:"
            echo "   - Run './dev.sh status' to check service status"
            echo "   - Run './dev.sh restart' to restart services"
            echo "   - Run './dev.sh stop' to stop services"
            echo "   - View logs: tail -f backend.log frontend.log"
            echo ""
            ;;
        status)
            show_status
            ;;
        restart)
            print_header "🔄 Restarting services..."
            echo ""
            print_status "Stopping services..."
            kill_port 8001
            kill_port 4000
            pkill -f "uvicorn.*8001" 2>/dev/null || true
            pkill -f "next.*dev" 2>/dev/null || true
            rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
            sleep 2
            echo ""
            ensure_backend_running
            ensure_frontend_running
            show_status
            ;;
        stop)
            print_header "🛑 Stopping services..."
            kill_port 8001
            kill_port 4000
            pkill -f "uvicorn.*8001" 2>/dev/null || true
            pkill -f "next.*dev" 2>/dev/null || true
            rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
            print_success "Services stopped"
            ;;
        *)
            echo "Usage: $0 [start|status|restart|stop]"
            echo ""
            echo "Commands:"
            echo "  start   - Start services (default, only starts if not running)"
            echo "  status  - Show current service status"
            echo "  restart - Restart all services"
            echo "  stop    - Stop all services"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
