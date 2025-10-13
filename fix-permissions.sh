#!/bin/bash

echo "🔧 Fixing Database Permissions"
echo "==============================="

cd /home/saiful/nextpanel-bill/billing-backend

# Fix database file ownership
echo "Fixing billing.db ownership..."
sudo chown saiful:saiful billing.db
sudo chmod 664 billing.db
echo "✅ Database permissions fixed"

# Fix entire backend directory
echo "Fixing backend directory ownership..."
sudo chown -R saiful:saiful /home/saiful/nextpanel-bill/billing-backend
echo "✅ Backend directory fixed"

# Fix frontend directory too
echo "Fixing frontend directory ownership..."
sudo chown -R saiful:saiful /home/saiful/nextpanel-bill/billing-frontend
echo "✅ Frontend directory fixed"

echo ""
echo "==============================="
echo "✅ All permissions fixed!"
echo ""
echo "NOW RESTART SERVICES:"
echo "  ./stop.sh"
echo "  ./start.sh"
echo ""

