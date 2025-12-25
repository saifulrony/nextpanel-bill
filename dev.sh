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
    # Use a shorter timeout to avoid hanging
    curl -s -f --max-time 2 http://localhost:8001/health >/dev/null 2>&1
}

check_frontend_health() {
    # Check if we get a valid HTTP response (200-399 or 500 means server is running)
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:4000 2>/dev/null || echo "000")
    # Accept 200-399 as healthy, 500 means server is running but may have errors
    [ "$status" != "000" ] && [ "$status" != "" ]
}

# Check if frontend has errors
check_frontend_has_errors() {
    local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:4000 2>/dev/null || echo "000")
    [ "$status" = "500" ]
}

# Check frontend logs for common error patterns
check_frontend_error_patterns() {
    local log_file="$PROJECT_ROOT/frontend.log"
    if [ -f "$log_file" ]; then
        # Check for common build errors
        if grep -q "Failed to compile\|Error:\|Cannot find module\|Module not found\|Parsing error\|Syntax error" "$log_file" 2>/dev/null; then
            return 0  # Found errors
        fi
    fi
    return 1  # No errors found
}

# Auto-fix frontend errors
auto_fix_frontend() {
    local frontend_pid=$(get_pid "$FRONTEND_PID_FILE")
    local port_pid=$(find_process_by_port 4000)
    
    print_warning "Frontend is returning 500 errors. Attempting auto-fix..."
    
    # Stop frontend
    if [ ! -z "$port_pid" ]; then
        print_status "Stopping frontend process..."
        kill_port 4000
        pkill -f "next.*dev.*4000" 2>/dev/null || true
        sleep 2
    fi
    
    # Clear Next.js cache
    print_status "Clearing Next.js cache to fix build errors..."
    cd "$PROJECT_ROOT/billing-frontend"
    rm -rf .next node_modules/.cache 2>/dev/null || true
    print_success "Cache cleared"
    
    # Clear old log (from project root)
    cd "$PROJECT_ROOT"
    [ -f "frontend.log" ] && mv -f frontend.log frontend.log.old 2>/dev/null || true
    
    # Restart frontend
    print_status "Restarting frontend..."
    start_frontend
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
    local max_wait=15
    while [ $waited -lt $max_wait ]; do
        # Check if port is open first (faster check)
        if check_port 8001; then
            # Try health check, but don't fail if it times out
            if check_backend_health; then
                print_success "Backend is running (PID: $pid)"
                return 0
            elif [ $waited -ge 5 ]; then
                # If port is open for 5+ seconds, assume it's ready even if health check fails
                print_warning "Backend port is open but health check timed out - assuming ready"
                print_success "Backend is running (PID: $pid)"
                return 0
            fi
        fi
        sleep 2
        waited=$((waited + 2))
    done
    
    # Final check - if port is open, assume it's working
    if check_port 8001; then
        print_warning "Backend port is open - assuming service is ready"
        print_success "Backend is running (PID: $pid)"
        return 0
    fi
    
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
    
    # Clear cache if there are HMR issues (optional - can be enabled via env var)
    if [ "${CLEAR_CACHE_ON_START:-0}" = "1" ]; then
        print_status "Clearing Next.js cache..."
        rm -rf .next node_modules/.cache 2>/dev/null || true
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
    print_status "Waiting for frontend to compile (this may take 30-90 seconds)..."
    local waited=0
    local max_wait=120  # Increased to 120 seconds for cache-clear rebuilds
    local consecutive_errors=0
    while [ $waited -lt $max_wait ]; do
        local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:4000 2>/dev/null || echo "000")
        
        # If we get 200-399, it's healthy
        if [ "$http_status" != "000" ] && [ "$http_status" != "" ] && [ "$http_status" != "500" ]; then
            print_success "Frontend is running (PID: $frontend_pid)"
            return 0
        fi
        
        # If we get 500, check if it's still compiling or has actual errors
        if [ "$http_status" = "500" ]; then
            consecutive_errors=$((consecutive_errors + 1))
            # If we've seen 500 for more than 30 seconds (10 checks), check logs
            if [ $waited -gt 30 ] && check_frontend_error_patterns; then
                print_warning "Frontend has compilation errors. Check logs: tail -f frontend.log"
                return 1
            fi
        else
            consecutive_errors=0  # Reset counter if status changed
        fi
        
        # Show progress for long waits
        if [ $((waited % 15)) -eq 0 ] && [ $waited -gt 0 ]; then
            print_status "Still compiling... (${waited}s elapsed)"
        fi
        
        sleep 3
        waited=$((waited + 3))
    done
    
    # Final check - be more lenient after long wait
    local final_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:4000 2>/dev/null || echo "000")
    if [ "$final_status" != "000" ] && [ "$final_status" != "" ]; then
        if [ "$final_status" = "500" ] && check_frontend_error_patterns; then
            print_warning "Frontend has compilation errors after ${max_wait}s. Check logs: tail -f frontend.log"
            return 1
        else
            print_success "Frontend is running (PID: $frontend_pid) - may still be compiling"
            return 0
        fi
    fi
    
    print_warning "Frontend may still be compiling. Check logs: tail -f frontend.log"
    return 0  # Don't fail - Next.js can take a while on first build
}

# Check and start backend if needed
ensure_backend_running() {
    local backend_pid=$(get_pid "$BACKEND_PID_FILE")
    local port_pid=$(find_process_by_port 8001)
    
    # Check if backend is already running (port check is sufficient)
    if [ ! -z "$port_pid" ] && check_port 8001; then
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
        # Check if it's returning 500 errors
        if check_frontend_has_errors; then
            # Check if it's been running for more than 60 seconds and has actual error patterns
            local uptime=$(ps -o etime= -p "$port_pid" 2>/dev/null | awk -F: '{if (NF==2) print $1*60+$2; else if (NF==3) print $1*3600+$2*60+$3; else print 0}')
            # Only auto-fix if it's been running for a while AND has actual error patterns in logs
            if [ "${uptime:-0}" -gt 60 ] && check_frontend_error_patterns; then
                auto_fix_frontend
                return $?
            else
                print_warning "Frontend is compiling, may show errors temporarily (running for ${uptime:-0}s)..."
                return 0
            fi
        fi
        
        # Frontend is healthy
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
    local actual_pid=$(find_process_by_port 4000)
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:4000 2>/dev/null || echo "000")
    
    if check_frontend_health; then
        if [ "$http_status" = "500" ]; then
            print_warning "Frontend: Running but returning errors (PID: ${actual_pid:-$frontend_pid}, HTTP: $http_status)"
            echo "   💡 Tip: Run './dev.sh fix-frontend' to auto-fix, or wait for auto-fix on next start"
        else
            print_success "Frontend: Running (PID: ${actual_pid:-$frontend_pid})"
        fi
        echo "   URL: http://localhost:4000"
        NETWORK_IP=$(hostname -I | awk '{print $1}')
        echo "   Network: http://${NETWORK_IP}:4000"
    elif check_port 4000; then
        print_warning "Frontend: Port in use but not responding (may be compiling or has errors)"
        echo "   Port 4000 is in use by PID: ${actual_pid:-unknown}"
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
            
            # Show status first
            show_status
            
            # Check and auto-fix frontend errors after a longer wait (to allow initial compilation)
            print_status "Waiting 15 seconds to check for frontend errors..."
            sleep 15
            
            # Only auto-fix if we have persistent errors and it's not just compiling
            if check_frontend_has_errors; then
                # Check if it's a real error or just compiling
                local frontend_pid=$(find_process_by_port 4000)
                if [ ! -z "$frontend_pid" ]; then
                    local uptime=$(ps -o etime= -p "$frontend_pid" 2>/dev/null | awk -F: '{if (NF==2) print $1*60+$2; else if (NF==3) print $1*3600+$2*60+$3; else print 0}')
                    # Only auto-fix if it's been running for more than 30 seconds and has error patterns
                    if [ "${uptime:-0}" -gt 30 ] && check_frontend_error_patterns; then
                        print_warning "Frontend errors detected, attempting auto-fix..."
                        auto_fix_frontend
                        # Wait again after auto-fix
                        print_status "Waiting 20 seconds for frontend to recompile after auto-fix..."
                        sleep 20
                        show_status
                    else
                        print_status "Frontend may still be compiling, will check again later..."
                    fi
                fi
            fi
            
            # Check if all services are actually healthy
            local backend_ok=false
            local frontend_ok=false
            
            if check_backend_health; then
                backend_ok=true
            elif check_port 8001; then
                backend_ok=true  # Port is open, assume it's working
            fi
            
            if check_frontend_health; then
                frontend_ok=true
            elif check_port 4000; then
                frontend_ok=true  # Port is open, may be compiling
            fi
            
            if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
            print_success "All services are running!"
            elif [ "$backend_ok" = true ]; then
                print_warning "Backend is running, but frontend may still be starting..."
            elif [ "$frontend_ok" = true ]; then
                print_warning "Frontend is running, but backend may have issues..."
            else
                print_error "Some services may not be running properly. Check status above."
            fi
            echo ""
            echo "💡 Tips:"
            echo "   - Run './dev.sh status' to check service status"
            echo "   - Run './dev.sh restart' to restart services (clears Next.js cache)"
            echo "   - Run './dev.sh stop' to stop services"
            echo "   - Run './dev.sh clear-cache' to clear Next.js cache only"
            echo "   - Run './dev.sh fix-frontend' to manually fix frontend errors"
            echo "   - View logs: tail -f backend.log frontend.log"
            echo ""
            echo "🔧 Auto-fix: Frontend 500 errors are automatically detected and fixed!"
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
            print_status "Clearing Next.js cache..."
            rm -rf "$PROJECT_ROOT/billing-frontend/.next" 2>/dev/null || true
            rm -rf "$PROJECT_ROOT/billing-frontend/node_modules/.cache" 2>/dev/null || true
            print_success "Cache cleared"
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
        clear-cache)
            print_header "🧹 Clearing Next.js cache..."
            rm -rf "$PROJECT_ROOT/billing-frontend/.next" 2>/dev/null || true
            rm -rf "$PROJECT_ROOT/billing-frontend/node_modules/.cache" 2>/dev/null || true
            print_success "Cache cleared! Restart frontend with './dev.sh restart' or './dev.sh start'"
            ;;
        fix-frontend)
            print_header "🔧 Fixing frontend errors..."
            if check_frontend_has_errors || check_frontend_error_patterns; then
                auto_fix_frontend
            else
                print_success "No frontend errors detected. Frontend appears to be healthy."
            fi
            show_status
            ;;
        *)
            echo "Usage: $0 [start|status|restart|stop|clear-cache|fix-frontend]"
            echo ""
            echo "Commands:"
            echo "  start        - Start services (default, only starts if not running)"
            echo "  status       - Show current service status"
            echo "  restart      - Restart all services (clears Next.js cache)"
            echo "  stop         - Stop all services"
            echo "  clear-cache  - Clear Next.js build cache only"
            echo "  fix-frontend - Manually fix frontend errors (clears cache and restarts)"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
