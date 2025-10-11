#!/bin/bash
# Quick diagnostic script to check billing service status

echo "=== Billing Services Status ==="
echo ""

echo "Backend Process:"
ps aux | grep "uvicorn.*8001" | grep -v grep || echo "  ❌ Backend NOT running"
echo ""

echo "Backend Health:"
curl -s http://localhost:8001/health 2>&1 || echo "  ❌ Backend not responding"
echo ""

echo "CORS Test (from 192.168.10.203:3002):"
curl -s -I -X OPTIONS http://localhost:8001/api/v1/auth/register \
  -H "Origin: http://192.168.10.203:3002" \
  -H "Access-Control-Request-Method: POST" 2>&1 | grep -i "access-control" || echo "  ❌ CORS not configured"
echo ""

echo "Frontend Process:"
ps aux | grep "next dev.*3002" | grep -v grep || echo "  ❌ Frontend NOT running"
echo ""

echo "Backend Log (last 10 lines):"
tail -10 /home/saiful/nextPanel/billing/billing-backend/backend.log 2>&1

