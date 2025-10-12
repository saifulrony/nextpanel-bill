#!/bin/bash

# NextPanel API Key Diagnostic Tool
# Tests your NextPanel API key permissions directly

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  NextPanel API Key Diagnostic Tool        ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get API credentials from billing system
echo -e "${YELLOW}📡 Fetching server configuration from billing system...${NC}"

TOKEN=$(curl -s -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to authenticate with billing system${NC}"
    exit 1
fi

# Get server details
SERVER_INFO=$(curl -s http://192.168.10.203:8001/api/v1/nextpanel/servers \
  -H "Authorization: Bearer $TOKEN" | jq '.[0]')

SERVER_URL=$(echo $SERVER_INFO | jq -r '.base_url')
API_KEY=$(echo $SERVER_INFO | jq -r '.api_key' 2>/dev/null || echo "")
API_SECRET=$(echo $SERVER_INFO | jq -r '.api_secret' 2>/dev/null || echo "")

if [ -z "$API_KEY" ] || [ "$API_KEY" == "null" ]; then
    echo -e "${RED}❌ Could not retrieve API key from billing system${NC}"
    echo ""
    echo -e "${YELLOW}Please provide your NextPanel API credentials:${NC}"
    read -p "NextPanel URL (e.g., http://192.168.10.203:3000): " SERVER_URL
    read -p "API Key (npk_...): " API_KEY
    read -s -p "API Secret (nps_...): " API_SECRET
    echo ""
else
    echo -e "${GREEN}✓ Retrieved server configuration${NC}"
    echo -e "  Server URL: ${SERVER_URL}"
    echo -e "  API Key: ${API_KEY:0:15}..."
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Testing NextPanel API Key                ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check (no auth required)${NC}"
HEALTH=$(curl -s -w "\nHTTP_CODE:%{http_code}" ${SERVER_URL}/api/health 2>&1)
HTTP_CODE=$(echo "$HEALTH" | grep "HTTP_CODE" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ Server is online and responding${NC}"
    echo -e "  Response: $HEALTH_BODY"
else
    echo -e "${RED}✗ Server is not responding (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 2: API Key Authentication
echo -e "${YELLOW}Test 2: API Key Authentication${NC}"
AUTH_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  -H "X-API-Secret: $API_SECRET" \
  ${SERVER_URL}/api/v1/billing/accounts 2>&1)

HTTP_CODE=$(echo "$AUTH_TEST" | grep "HTTP_CODE" | cut -d: -f2)
AUTH_BODY=$(echo "$AUTH_TEST" | sed '/HTTP_CODE/d')

echo -e "  HTTP Code: $HTTP_CODE"
echo -e "  Response: $AUTH_BODY"

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
    echo -e "${GREEN}✓ API Key is valid and authenticated${NC}"
elif [ "$HTTP_CODE" == "403" ]; then
    echo -e "${RED}✗ API Key rejected (403 Forbidden)${NC}"
    echo -e "${YELLOW}  This is the problem! Your API key doesn't have permission.${NC}"
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "${RED}✗ API Key authentication failed (401 Unauthorized)${NC}"
    echo -e "${YELLOW}  Check if your API Key and Secret are correct.${NC}"
else
    echo -e "${RED}✗ Unexpected response (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 3: Try to create an account (this will fail but shows the exact error)
echo -e "${YELLOW}Test 3: Account Creation Permission${NC}"
echo -e "Attempting to create a test account..."

TEST_USERNAME="test_$(date +%s)"
CREATE_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "X-API-Secret: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USERNAME\",
    \"email\": \"test@example.com\",
    \"password\": \"TestPass123!\",
    \"full_name\": \"Test User\"
  }" \
  ${SERVER_URL}/api/v1/billing/accounts 2>&1)

HTTP_CODE=$(echo "$CREATE_TEST" | grep "HTTP_CODE" | cut -d: -f2)
CREATE_BODY=$(echo "$CREATE_TEST" | sed '/HTTP_CODE/d')

echo -e "  HTTP Code: $HTTP_CODE"
echo -e "  Response: $CREATE_BODY"

if [ "$HTTP_CODE" == "201" ]; then
    echo -e "${GREEN}✓ Account creation successful!${NC}"
    echo -e "${GREEN}  Your API key has full permissions!${NC}"
elif [ "$HTTP_CODE" == "403" ]; then
    echo -e "${RED}✗ Permission denied (403 Forbidden)${NC}"
    echo -e "${YELLOW}  Error message: $CREATE_BODY${NC}"
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "${RED}✗ Authentication failed (401 Unauthorized)${NC}"
else
    echo -e "${YELLOW}⚠ HTTP $HTTP_CODE - $CREATE_BODY${NC}"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Diagnosis Summary                        ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Analyze results and provide recommendations
if [ "$HTTP_CODE" == "403" ]; then
    echo -e "${RED}❌ Problem Found: API Key Permission Denied${NC}"
    echo ""
    echo -e "${YELLOW}The API key is valid but doesn't have permission to create accounts.${NC}"
    echo ""
    echo -e "${BLUE}How to fix in NextPanel:${NC}"
    echo -e "1. Login to NextPanel: ${SERVER_URL}"
    echo -e "2. Go to: Super Admin → API Keys"
    echo -e "   (or Admin → Settings → API Keys)"
    echo -e "3. Find your API key (starts with ${API_KEY:0:10}...)"
    echo -e "4. Click 'Edit' or 'Manage'"
    echo -e "5. Set these options:"
    echo -e "   ${GREEN}Permission Level: SUPER_ADMIN${NC}"
    echo -e "   ${GREEN}Scopes: Check all (especially 'Account Management')${NC}"
    echo -e "   ${GREEN}Allowed IPs: Add 192.168.10.203 and 127.0.0.1${NC}"
    echo -e "6. Save changes"
    echo -e "7. Try provisioning again"
    echo ""
    echo -e "${YELLOW}Alternative:${NC}"
    echo -e "Create a NEW API key with SUPER_ADMIN level and update it in the billing system."
    echo ""
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "${RED}❌ Problem Found: Authentication Failed${NC}"
    echo ""
    echo -e "${YELLOW}The API Key or Secret is incorrect.${NC}"
    echo ""
    echo -e "${BLUE}How to fix:${NC}"
    echo -e "1. Login to NextPanel: ${SERVER_URL}"
    echo -e "2. Go to API Keys settings"
    echo -e "3. Create a new API key or copy the correct credentials"
    echo -e "4. Update in billing system:"
    echo -e "   - Go to http://192.168.10.203:4000/server"
    echo -e "   - Edit your server"
    echo -e "   - Update API Key and Secret"
    echo -e "   - Test connection"
    echo ""
elif [ "$HTTP_CODE" == "201" ]; then
    echo -e "${GREEN}✅ Everything is working perfectly!${NC}"
    echo ""
    echo -e "Your API key has all the necessary permissions."
    echo -e "Account provisioning should work without issues."
    echo ""
else
    echo -e "${YELLOW}⚠ Check the response above for details${NC}"
    echo ""
fi

echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Need more help?${NC}"
echo -e "1. Check NextPanel logs for detailed error messages"
echo -e "2. Review API key settings in NextPanel admin panel"
echo -e "3. Try creating a new API key with full SUPER_ADMIN permissions"
echo ""

