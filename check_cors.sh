#!/bin/bash
# Check backend log for CORS information
echo "=== Last 30 lines of backend log ==="
tail -30 /home/saiful/nextPanel/billing/billing-backend/backend.log

echo ""
echo "=== CORS-related entries ==="
grep -i "cors\|allow" /home/saiful/nextPanel/billing/billing-backend/backend.log | tail -10

