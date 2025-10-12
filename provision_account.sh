#!/bin/bash

# NextPanel Account Provisioning Script
# Quick and easy way to create hosting accounts

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="http://192.168.10.203:8001"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  NextPanel Account Provisioning Tool      ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get authentication token
echo -e "${YELLOW}🔐 Authenticating...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST ${API_BASE}/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")

TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Authentication failed!${NC}"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated successfully${NC}"
echo ""

# Check if servers exist
echo -e "${YELLOW}🖥️  Checking for NextPanel servers...${NC}"
SERVERS=$(curl -s ${API_BASE}/api/v1/nextpanel/servers \
  -H "Authorization: Bearer $TOKEN")

SERVER_COUNT=$(echo $SERVERS | jq -r '. | length')

if [ "$SERVER_COUNT" == "0" ]; then
    echo -e "${RED}❌ No NextPanel servers found!${NC}"
    echo -e "${YELLOW}Please add a server first:${NC}"
    echo -e "  1. Go to: http://192.168.10.203:4000/server"
    echo -e "  2. Click 'Add Server'"
    echo -e "  3. Fill in your NextPanel server details"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Found ${SERVER_COUNT} server(s)${NC}"
echo ""

# Show available servers
echo -e "${BLUE}Available Servers:${NC}"
echo $SERVERS | jq -r '.[] | "  [\(.id)] \(.name) - \(.base_url) (Capacity: \(.current_accounts)/\(.capacity))"'
echo ""

# Get customer information
echo -e "${YELLOW}📋 Customer Information${NC}"
read -p "Customer Email: " CUSTOMER_EMAIL
read -p "Customer Full Name: " CUSTOMER_NAME
read -p "Company Name (optional): " COMPANY_NAME
read -s -p "Customer Password: " CUSTOMER_PASSWORD
echo ""
echo ""

# Get hosting details
echo -e "${YELLOW}🏠 Hosting Account Details${NC}"
read -p "Hosting Username: " HOSTING_USERNAME
read -s -p "Hosting Password: " HOSTING_PASSWORD
echo ""

# Select server
if [ "$SERVER_COUNT" -gt "1" ]; then
    read -p "Select Server ID [1-${SERVER_COUNT}]: " SERVER_ID
else
    SERVER_ID="1"
    echo "Using server ID: $SERVER_ID"
fi
echo ""

# Confirm
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Review Information:${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Customer Email:    ${GREEN}${CUSTOMER_EMAIL}${NC}"
echo -e "Customer Name:     ${GREEN}${CUSTOMER_NAME}${NC}"
echo -e "Company:           ${GREEN}${COMPANY_NAME:-N/A}${NC}"
echo -e "Hosting Username:  ${GREEN}${HOSTING_USERNAME}${NC}"
echo -e "Server ID:         ${GREEN}${SERVER_ID}${NC}"
echo ""

read -p "Proceed with account creation? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}⚙️  Creating account...${NC}"
echo ""

# Step 1: Create customer
echo -e "${YELLOW}1. Creating customer in billing system...${NC}"
CUSTOMER_DATA="{
  \"email\": \"${CUSTOMER_EMAIL}\",
  \"full_name\": \"${CUSTOMER_NAME}\",
  \"password\": \"${CUSTOMER_PASSWORD}\",
  \"is_active\": true"

if [ ! -z "$COMPANY_NAME" ]; then
    CUSTOMER_DATA="${CUSTOMER_DATA},\"company_name\": \"${COMPANY_NAME}\""
fi

CUSTOMER_DATA="${CUSTOMER_DATA}}"

CUSTOMER_RESPONSE=$(curl -s -X POST ${API_BASE}/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$CUSTOMER_DATA")

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')

if [ "$CUSTOMER_ID" == "null" ] || [ -z "$CUSTOMER_ID" ]; then
    echo -e "${RED}❌ Failed to create customer!${NC}"
    echo "Error: $(echo $CUSTOMER_RESPONSE | jq -r '.detail // "Unknown error"')"
    exit 1
fi

echo -e "${GREEN}✓ Customer created (ID: ${CUSTOMER_ID})${NC}"
echo ""

# Step 2: Get available plans
echo -e "${YELLOW}2. Fetching available plans...${NC}"
PLANS=$(curl -s ${API_BASE}/api/v1/plans \
  -H "Authorization: Bearer $TOKEN")

PLAN_ID=$(echo $PLANS | jq -r '.[0].id')
PLAN_NAME=$(echo $PLANS | jq -r '.[0].name')

if [ "$PLAN_ID" == "null" ] || [ -z "$PLAN_ID" ]; then
    echo -e "${RED}❌ No plans available!${NC}"
    echo "Please create a plan first in the admin dashboard."
    exit 1
fi

echo -e "${GREEN}✓ Using plan: ${PLAN_NAME} (ID: ${PLAN_ID})${NC}"
echo ""

# Step 3: Add license to customer
echo -e "${YELLOW}3. Creating license for customer...${NC}"
LICENSE_RESPONSE=$(curl -s -X POST ${API_BASE}/api/v1/customers/${CUSTOMER_ID}/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"${PLAN_ID}\",
    \"billing_cycle\": \"monthly\",
    \"create_subscription\": true
  }")

LICENSE_KEY=$(echo $LICENSE_RESPONSE | jq -r '.license_key')

if [ "$LICENSE_KEY" == "null" ] || [ -z "$LICENSE_KEY" ]; then
    echo -e "${RED}❌ Failed to create license!${NC}"
    echo "Error: $(echo $LICENSE_RESPONSE | jq -r '.detail // "Unknown error"')"
    exit 1
fi

echo -e "${GREEN}✓ License created: ${LICENSE_KEY}${NC}"
echo ""

# Step 4: Provision hosting account
echo -e "${YELLOW}4. Provisioning hosting account on NextPanel...${NC}"
PROVISION_RESPONSE=$(curl -s -X POST ${API_BASE}/api/v1/nextpanel/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": ${CUSTOMER_ID},
    \"username\": \"${HOSTING_USERNAME}\",
    \"email\": \"${CUSTOMER_EMAIL}\",
    \"password\": \"${HOSTING_PASSWORD}\",
    \"full_name\": \"${CUSTOMER_NAME}\",
    \"company\": \"${COMPANY_NAME}\",
    \"server_id\": ${SERVER_ID}
  }")

PROVISION_SUCCESS=$(echo $PROVISION_RESPONSE | jq -r '.success')

if [ "$PROVISION_SUCCESS" != "true" ]; then
    echo -e "${RED}❌ Failed to provision hosting account!${NC}"
    echo "Error: $(echo $PROVISION_RESPONSE | jq -r '.error // "Unknown error"')"
    echo ""
    echo -e "${YELLOW}Note: Customer and license were created successfully.${NC}"
    echo -e "Customer ID: ${CUSTOMER_ID}"
    echo -e "License Key: ${LICENSE_KEY}"
    exit 1
fi

NEXTPANEL_USER_ID=$(echo $PROVISION_RESPONSE | jq -r '.nextpanel_user_id')
SERVER_NAME=$(echo $PROVISION_RESPONSE | jq -r '.server_name')
SERVER_URL=$(echo $PROVISION_RESPONSE | jq -r '.server_url')

echo -e "${GREEN}✓ Hosting account provisioned successfully!${NC}"
echo ""

# Success summary
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}✅ Account Created Successfully!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Customer Details:${NC}"
echo -e "  Customer ID:      ${CUSTOMER_ID}"
echo -e "  Email:            ${CUSTOMER_EMAIL}"
echo -e "  Name:             ${CUSTOMER_NAME}"
echo ""
echo -e "${YELLOW}Billing Details:${NC}"
echo -e "  License Key:      ${LICENSE_KEY}"
echo -e "  Plan:             ${PLAN_NAME}"
echo ""
echo -e "${YELLOW}Hosting Details:${NC}"
echo -e "  Server:           ${SERVER_NAME}"
echo -e "  NextPanel URL:    ${SERVER_URL}"
echo -e "  Username:         ${HOSTING_USERNAME}"
echo -e "  User ID:          ${NEXTPANEL_USER_ID}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Send welcome email to customer with credentials"
echo -e "  2. Customer can login at: ${SERVER_URL}"
echo -e "  3. Customer uses credentials:"
echo -e "     Username: ${HOSTING_USERNAME}"
echo -e "     Password: (the one you set)"
echo ""
echo -e "${BLUE}============================================${NC}"
echo ""

# Save to file
SUMMARY_FILE="provisioned_accounts.log"
echo "$(date): Customer: ${CUSTOMER_EMAIL}, Username: ${HOSTING_USERNAME}, License: ${LICENSE_KEY}, Server: ${SERVER_NAME}" >> $SUMMARY_FILE
echo -e "${GREEN}ℹ️  Details saved to: ${SUMMARY_FILE}${NC}"

