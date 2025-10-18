#!/bin/bash

# NextPanel Billing System - Docker Development Mode Script
# This script manages the Docker-based development environment

set -e

echo "🐳 NextPanel Billing System - Docker Development Mode"
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

# Function to check if container is running
check_container() {
    local container_name=$1
    if docker ps --format "table {{.Names}}" | grep -q "^${container_name}$"; then
        return 0  # Container is running
    else
        return 1  # Container is not running
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    if ss -tlnp | grep -q ":${port} "; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Show current status
print_status "Checking current Docker container status..."
echo ""

if check_container "billing-backend"; then
    print_success "✅ Backend container is running"
    echo "   Container: billing-backend"
    echo "   Port mapping: 8001:8000"
    echo "   API URL: http://localhost:8001"
    echo "   Docs: http://localhost:8001/docs"
else
    print_warning "❌ Backend container is not running"
fi

if check_container "billing-frontend"; then
    print_success "✅ Frontend container is running"
    echo "   Container: billing-frontend"
    echo "   Port mapping: 4000:4000"
    echo "   URL: http://localhost:4000"
else
    print_warning "❌ Frontend container is not running"
fi

if check_container "billing-postgres"; then
    print_success "✅ PostgreSQL container is running"
    echo "   Container: billing-postgres"
    echo "   Port mapping: 5432:5432"
else
    print_warning "❌ PostgreSQL container is not running"
fi

if check_container "billing-redis"; then
    print_success "✅ Redis container is running"
    echo "   Container: billing-redis"
    echo "   Port mapping: 6379:6379"
else
    print_warning "❌ Redis container is not running"
fi

echo ""

# Check if all containers are running
all_running=true
if ! check_container "billing-backend"; then all_running=false; fi
if ! check_container "billing-frontend"; then all_running=false; fi
if ! check_container "billing-postgres"; then all_running=false; fi
if ! check_container "billing-redis"; then all_running=false; fi

if [ "$all_running" = true ]; then
    print_success "🎉 All containers are running! Your system is ready."
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: http://localhost:4000"
    echo "   Backend API: http://localhost:8001"
    echo "   API Documentation: http://localhost:8001/docs"
    echo "   Admin Dashboard: http://localhost:4000/admin"
    echo "   Domain Pricing: http://localhost:4000/admin/domain-pricing"
    echo ""
    echo "📊 Container Management:"
    echo "   View logs: docker-compose logs -f [service]"
    echo "   Stop all: docker-compose down"
    echo "   Restart: docker-compose restart [service]"
    echo "   Rebuild: docker-compose up --build"
else
    print_warning "Some containers are not running. Starting the full stack..."
    echo ""
    
    # Start the Docker Compose stack
    print_status "Starting Docker Compose stack..."
    docker-compose up -d
    
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check status again
    print_status "Checking service status..."
    if check_container "billing-backend" && check_container "billing-frontend"; then
        print_success "🎉 System started successfully!"
        echo ""
        echo "🌐 Access URLs:"
        echo "   Frontend: http://localhost:4000"
        echo "   Backend API: http://localhost:8001"
        echo "   API Documentation: http://localhost:8001/docs"
        echo "   Admin Dashboard: http://localhost:4000/admin"
        echo "   Domain Pricing: http://localhost:4000/admin/domain-pricing"
    else
        print_error "Failed to start some services. Check logs with: docker-compose logs"
    fi
fi

echo ""
echo "📝 Useful Commands:"
echo "   View all logs: docker-compose logs -f"
echo "   View backend logs: docker-compose logs -f backend"
echo "   View frontend logs: docker-compose logs -f frontend"
echo "   Stop all: docker-compose down"
echo "   Restart backend: docker-compose restart backend"
echo "   Restart frontend: docker-compose restart frontend"
echo "   Rebuild and restart: docker-compose up --build -d"
