#!/bin/bash

# Check what your current API key can actually do

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Current API Key Permission Test          ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

echo -e "${YELLOW}Please provide your NextPanel API credentials:${NC}"
echo -e "${YELLOW}(Get these from: http://192.168.10.203:4000/server)${NC}"
echo ""
read -p "API Key (npk_...): " API_KEY
read -s -p "API Secret (nps_...): " API_SECRET
echo ""
echo ""

NEXTPANEL_URL="http://192.168.10.203:3000"

echo -e "${BLUE}Testing API Key: ${API_KEY:0:20}...${NC}"
echo ""

# Test 1: Simple GET request
echo -e "${YELLOW}Test 1: List accounts (GET request)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "X-API-Key: $API_KEY" \
  -H "X-API-Secret: $API_SECRET" \
  ${NEXTPANEL_URL}/api/v1/billing/accounts 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "  HTTP Code: ${HTTP_CODE}"

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}  ✓ API key can READ accounts${NC}"
elif [ "$HTTP_CODE" == "403" ]; then
    echo -e "${RED}  ✗ API key CANNOT read accounts (no permission)${NC}"
    echo -e "  Error: $BODY"
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "${RED}  ✗ API key authentication FAILED (wrong credentials)${NC}"
    echo -e "  Error: $BODY"
else
    echo -e "${YELLOW}  Response: $BODY${NC}"
fi
echo ""

# Test 2: Create account (POST request)
echo -e "${YELLOW}Test 2: Create account (POST request - the actual issue)${NC}"
TEST_USERNAME="apitest_$(date +%s)"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "X-API-Secret: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USERNAME\",
    \"email\": \"apitest@example.com\",
    \"password\": \"TestPass123!\",
    \"full_name\": \"API Test User\"
  }" \
  ${NEXTPANEL_URL}/api/v1/billing/accounts 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "  HTTP Code: ${HTTP_CODE}"
echo -e "  Response: $BODY"
echo ""

if [ "$HTTP_CODE" == "201" ]; then
    echo -e "${GREEN}✅ SUCCESS! API key can CREATE accounts!${NC}"
    echo -e "${GREEN}   Your API key has proper permissions!${NC}"
    echo ""
    echo -e "${BLUE}Provisioning should work now. Try it in the billing system.${NC}"
    
elif [ "$HTTP_CODE" == "403" ]; then
    echo -e "${RED}❌ FAILED! API key CANNOT create accounts${NC}"
    echo ""
    
    # Parse the error message
    if echo "$BODY" | grep -q "super admin"; then
        echo -e "${YELLOW}Error indicates: Missing SUPER ADMIN privileges${NC}"
        echo ""
        echo -e "${RED}This means your 'modify access' did NOT work properly!${NC}"
        echo ""
        echo -e "${BLUE}Possible reasons:${NC}"
        echo -e "1. Changes were not saved in NextPanel"
        echo -e "2. You selected wrong permission level"
        echo -e "3. NextPanel requires server restart after permission change"
        echo -e "4. There's a cache issue"
        echo ""
        echo -e "${GREEN}Solutions to try:${NC}"
        echo ""
        echo -e "${YELLOW}Solution 1: Restart NextPanel Server${NC}"
        echo -e "  On your NextPanel server, restart the application:"
        echo -e "  sudo systemctl restart nextpanel"
        echo -e "  OR"
        echo -e "  pkill -f uvicorn && cd /path/to/nextpanel && uvicorn main:app --reload"
        echo ""
        echo -e "${YELLOW}Solution 2: Check Permission Level in NextPanel${NC}"
        echo -e "  1. Login to NextPanel admin"
        echo -e "  2. Go to API Keys"
        echo -e "  3. Find your key: ${API_KEY:0:20}..."
        echo -e "  4. Verify it shows: SUPER_ADMIN (not BILLING, not ADMIN)"
        echo -e "  5. If not, change it to SUPER_ADMIN"
        echo -e "  6. Click Save"
        echo -e "  7. Restart NextPanel"
        echo ""
        echo -e "${YELLOW}Solution 3: Create New Key (If Above Don't Work)${NC}"
        echo -e "  Sometimes it's easier to just create a new key from scratch"
        echo -e "  See: FIX_API_KEY_NOW.md for steps"
        echo ""
        
    elif echo "$BODY" | grep -q "IP address"; then
        echo -e "${YELLOW}Error indicates: IP address not allowed${NC}"
        echo -e "Fix: Add 127.0.0.1 to allowed IPs"
        
    else
        echo -e "${YELLOW}Error: $BODY${NC}"
    fi
    
elif [ "$HTTP_CODE" == "401" ]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo -e "${YELLOW}Your API Key or Secret is incorrect${NC}"
    echo ""
    echo -e "Double-check the credentials you entered match what's in NextPanel"
    
elif [ "$HTTP_CODE" == "400" ]; then
    # Username might already exist - that's actually OK for this test!
    if echo "$BODY" | grep -q "already exists"; then
        echo -e "${GREEN}✅ API key works! (Username just already exists)${NC}"
        echo -e "${GREEN}   Your permissions are correct!${NC}"
    else
        echo -e "${YELLOW}⚠ Bad request: $BODY${NC}"
    fi
    
else
    echo -e "${RED}Unexpected response (HTTP ${HTTP_CODE})${NC}"
    echo -e "Response: $BODY"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo ""

