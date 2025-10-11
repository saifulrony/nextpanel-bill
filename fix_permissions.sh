#!/bin/bash

# Fix permissions for billing frontend .next directory

echo "Fixing permissions for billing frontend..."

# Change ownership of .next directory
sudo chown -R saiful:saiful /home/saiful/nextPanel/billing/billing-frontend/.next

# Remove .next directory
rm -rf /home/saiful/nextPanel/billing/billing-frontend/.next

echo "Permissions fixed! You can now restart the frontend."
echo "Run: cd /home/saiful/nextPanel/billing && ./start.sh"

