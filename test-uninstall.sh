#!/bin/bash

echo "Testing chatbot module uninstallation..."

# Get admin token
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' | jq -r '.access_token')

echo "Token obtained: ${TOKEN:0:20}..."

# Uninstall chatbot module
echo "Uninstalling chatbot module..."
curl -X DELETE "http://localhost:8000/api/v1/marketplace/uninstall/620a0ddf-a664-4199-8778-719635e8d3d2" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "Checking if support chats files exist..."
if [ -d "/home/saiful/nextpanel-bill/billing-frontend/src/app/admin/support/chats" ]; then
    echo "❌ Admin support chats directory still exists!"
    ls -la /home/saiful/nextpanel-bill/billing-frontend/src/app/admin/support/chats/
else
    echo "✅ Admin support chats directory removed!"
fi

if [ -d "/home/saiful/nextpanel-bill/billing-frontend/src/app/customer/support/chats" ]; then
    echo "❌ Customer support chats directory still exists!"
    ls -la /home/saiful/nextpanel-bill/billing-frontend/src/app/customer/support/chats/
else
    echo "✅ Customer support chats directory removed!"
fi

echo "Testing page access..."
echo "Admin support chats: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/admin/support/chats)"
echo "Customer support chats: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/customer/support/chats/new)"
