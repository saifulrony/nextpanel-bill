# How to Create NextPanel Accounts - Complete Guide

## 🎯 Overview

This guide shows you **3 ways** to create NextPanel hosting accounts through your billing system:

1. **Interactive Script** (Easiest) ⭐ Recommended
2. **Admin Web UI** (Manual but user-friendly)
3. **API Commands** (For automation/integration)

---

## Method 1: Interactive Script (Easiest) ⭐

### Step 1: Make Sure Backend is Running

```bash
curl http://192.168.10.203:8001/health
# Should return: {"status":"healthy",...}
```

### Step 2: Run the Provisioning Script

```bash
cd /home/saiful/nextpanel-bill
./provision_account.sh
```

### What the Script Does:

1. ✅ Authenticates with billing API
2. ✅ Checks available NextPanel servers
3. ✅ Prompts you for customer information
4. ✅ Creates customer account
5. ✅ Assigns a license
6. ✅ Provisions hosting account on NextPanel
7. ✅ Shows complete summary

### Example Output:

```
============================================
  NextPanel Account Provisioning Tool      
============================================

🔐 Authenticating...
✓ Authenticated successfully

🖥️  Checking for NextPanel servers...
✓ Found 1 server(s)

Available Servers:
  [1] Production Server - http://192.168.10.203:3000 (Capacity: 0/100)

📋 Customer Information
Customer Email: customer@example.com
Customer Full Name: John Doe
Company Name (optional): Acme Corp
Customer Password: ********

🏠 Hosting Account Details
Hosting Username: johndoe
Hosting Password: ********
Using server ID: 1

============================================
✅ Account Created Successfully!
============================================

Customer Details:
  Customer ID:      2
  Email:            customer@example.com
  Name:             John Doe

Billing Details:
  License Key:      NP-XXXX-XXXX-XXXX
  Plan:             Professional Hosting

Hosting Details:
  Server:           Production Server
  NextPanel URL:    http://192.168.10.203:3000
  Username:         johndoe
  User ID:          123
```

---

## Method 2: Admin Web UI

### Prerequisites

1. Add at least one NextPanel server first (see below)
2. Login as admin

### Step-by-Step

#### A. Add NextPanel Server (One-Time Setup)

1. **Login to Admin Dashboard**
   ```
   URL: http://192.168.10.203:4000/login
   Email: admin@test.com
   Password: Admin123!
   ```

2. **Navigate to Server Management**
   - Click **"Server"** in the sidebar
   - Click **"Add Server"** button

3. **Fill in Server Details**
   ```
   Server Name:    Production Server 1
   Description:    Main hosting server
   Base URL:       http://192.168.10.203:3000
   API Key:        npk_xxxxxxxxxxxxx
   API Secret:     nps_xxxxxxxxxxxxx
   Capacity:       100
   Location:       US-East (optional)
   ```

4. **Test Connection**
   - Click **"Test Connection"** button
   - Wait for: ✅ "Connection successful! Server is online."

5. **Save Server**
   - Click **"Add Server"**
   - Server appears in the list

#### B. Create Customer

1. **Go to Customers Page**
   - Click **"Customers"** in sidebar
   - Click **"Add Customer"** button

2. **Fill Customer Details**
   ```
   Email:          customer@example.com
   Full Name:      John Doe
   Company Name:   Acme Corp (optional)
   Password:       SecurePassword123!
   ```

3. **Create Customer**
   - Click **"Create Customer"**
   - Customer appears in the list

#### C. Add Product/License to Customer

1. **View Customer Details**
   - Click the eye icon (👁️) next to the customer

2. **Add Product**
   - Click **"Add Product"** button
   - Select a plan from dropdown
   - Choose billing cycle (Monthly/Yearly)
   - Click **"Add Product"**

3. **License Created**
   - A license key is automatically generated
   - Customer now has access to hosting

#### D. Provision Hosting Account

**Note:** Currently, there's no UI button for this. You must use the API or script.

**Quick Command:**
```bash
# Get your auth token first
TOKEN=$(curl -s -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.access_token')

# Provision account (replace CUSTOMER_ID with actual ID)
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 2,
    "username": "johndoe",
    "email": "customer@example.com",
    "password": "HostingPassword123!",
    "full_name": "John Doe",
    "company": "Acme Corp",
    "server_id": 1
  }'
```

---

## Method 3: Pure API Commands

### Prerequisites

Install `jq` for JSON parsing:
```bash
sudo apt-get install jq -y
```

### Complete Workflow

```bash
#!/bin/bash

# Configuration
API_BASE="http://192.168.10.203:8001"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="Admin123!"

# 1. Get auth token
echo "Getting auth token..."
TOKEN=$(curl -s -X POST ${API_BASE}/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
  | jq -r '.access_token')

echo "Token: ${TOKEN:0:20}..."

# 2. Create customer
echo "Creating customer..."
CUSTOMER_RESPONSE=$(curl -s -X POST ${API_BASE}/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcustomer@example.com",
    "full_name": "New Customer",
    "company_name": "New Corp",
    "password": "Password123!",
    "is_active": true
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')
echo "Customer ID: $CUSTOMER_ID"

# 3. Get first plan
echo "Getting plan..."
PLAN_ID=$(curl -s ${API_BASE}/api/v1/plans \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[0].id')
echo "Plan ID: $PLAN_ID"

# 4. Add license to customer
echo "Adding license..."
LICENSE_RESPONSE=$(curl -s -X POST ${API_BASE}/api/v1/customers/${CUSTOMER_ID}/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"${PLAN_ID}\",
    \"billing_cycle\": \"monthly\",
    \"create_subscription\": true
  }")

LICENSE_KEY=$(echo $LICENSE_RESPONSE | jq -r '.license_key')
echo "License Key: $LICENSE_KEY"

# 5. Provision hosting account
echo "Provisioning hosting account..."
PROVISION_RESPONSE=$(curl -s -X POST ${API_BASE}/api/v1/nextpanel/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": ${CUSTOMER_ID},
    \"username\": \"newuser_$(date +%s)\",
    \"email\": \"newcustomer@example.com\",
    \"password\": \"Hosting123!\",
    \"full_name\": \"New Customer\",
    \"company\": \"New Corp\",
    \"server_id\": 1
  }")

echo "Provision Response:"
echo $PROVISION_RESPONSE | jq '.'

# 6. Summary
echo ""
echo "============================================"
echo "Account created successfully!"
echo "============================================"
echo "Customer ID: $CUSTOMER_ID"
echo "License Key: $LICENSE_KEY"
echo "NextPanel Server: $(echo $PROVISION_RESPONSE | jq -r '.server_name')"
echo "NextPanel URL: $(echo $PROVISION_RESPONSE | jq -r '.server_url')"
echo "============================================"
```

---

## 📊 Verification & Management

### Check Server Status

```bash
curl http://192.168.10.203:8001/api/v1/nextpanel/servers/status \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### List All Customers

```bash
curl http://192.168.10.203:8001/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Get Customer Details

```bash
curl http://192.168.10.203:8001/api/v1/customers/CUSTOMER_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### View Provisioned Accounts Log

```bash
cat /home/saiful/nextpanel-bill/provisioned_accounts.log
```

---

## 🔧 Account Management

### Suspend Account

```bash
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/accounts/ACCOUNT_ID/suspend \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Payment overdue"}'
```

### Unsuspend Account

```bash
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/accounts/ACCOUNT_ID/unsuspend \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Account

```bash
curl -X DELETE http://192.168.10.203:8001/api/v1/nextpanel/accounts/ACCOUNT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚨 Troubleshooting

### Problem: "No servers found"

**Solution:**
Add a NextPanel server first:
1. Via UI: Go to `http://192.168.10.203:4000/server`
2. Or via script: `./provision_account.sh` will prompt you

### Problem: "Authentication failed"

**Solution:**
```bash
# Verify credentials work
curl -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}'
```

### Problem: "Connection test failed"

**Checks:**
1. Is NextPanel server running?
   ```bash
   curl http://192.168.10.203:3000/api/health
   ```

2. Are API credentials correct?
   - Check NextPanel server settings

3. Is there a firewall blocking the connection?
   ```bash
   telnet 192.168.10.203 3000
   ```

### Problem: "Provisioning failed"

**Check NextPanel logs:**
```bash
# On NextPanel server
tail -f /path/to/nextpanel/logs/app.log
```

**Common causes:**
- Username already exists
- Invalid package_id
- Insufficient API permissions
- Database issues

---

## 📚 Documentation Files

- **Complete Guide:** `NEXTPANEL_ACCOUNT_PROVISIONING_GUIDE.md`
- **Quick Reference:** `QUICK_PROVISIONING_REFERENCE.md`
- **Connection Fix:** `NEXTPANEL_CONNECTION_TEST_FIX.md`
- **API Docs:** `http://192.168.10.203:8001/docs`

---

## 🎯 Quick Reference Card

### Most Common: Run the Script

```bash
cd /home/saiful/nextpanel-bill
./provision_account.sh
```

That's it! The script will guide you through everything.

### For Automation: Use API

```bash
# Get token
TOKEN=$(curl -s -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.access_token')

# Provision (after creating customer and license)
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 2,
    "username": "username",
    "email": "email@example.com",
    "password": "password",
    "full_name": "Full Name",
    "server_id": 1
  }'
```

---

## ⚙️ System Services

### Check Backend Status

```bash
curl http://192.168.10.203:8001/health
```

### Restart Backend

```bash
cd /home/saiful/nextpanel-bill/billing-backend
fuser -k 8001/tcp 2>/dev/null || true
sleep 2
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
```

### View Backend Logs

```bash
tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log
```

---

## 🎉 Success Checklist

- [ ] Backend is running (`curl http://192.168.10.203:8001/health`)
- [ ] At least one NextPanel server added
- [ ] Server connection test successful
- [ ] Customer created
- [ ] License assigned to customer
- [ ] Hosting account provisioned
- [ ] Customer received credentials (manual email for now)

---

**Need Help?**

1. Check the logs: `tail -f billing-backend/backend.log`
2. Review API docs: `http://192.168.10.203:8001/docs`
3. Run the interactive script: `./provision_account.sh`

**Last Updated:** October 12, 2025

