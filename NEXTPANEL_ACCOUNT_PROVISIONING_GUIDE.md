# NextPanel Account Provisioning Guide

## Overview

This guide explains how to create and manage NextPanel hosting accounts through your billing system. The system supports **multi-server management** and **automatic provisioning**.

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step: Manual Provisioning](#step-by-step-manual-provisioning)
4. [Step-by-Step: Automated Flow](#step-by-step-automated-flow)
5. [API Reference](#api-reference)
6. [Workflow Diagram](#workflow-diagram)
7. [Troubleshooting](#troubleshooting)

---

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────────┐
│  Billing System │  API    │  NextPanel API   │  HTTP   │ NextPanel Server 1 │
│  (Port 4000/    │ ------> │  (Port 8001)     │ ------> │    (Port 3000)     │
│   Port 8001)    │         │                  │         │                    │
└─────────────────┘         └──────────────────┘         └────────────────────┘
                                      │                            
                                      │                   ┌────────────────────┐
                                      └──────────────────>│ NextPanel Server 2 │
                                                          │    (Another Port)  │
                                                          └────────────────────┘
```

### Components

1. **Billing Frontend** (`http://192.168.10.203:4000`) - Admin UI
2. **Billing Backend API** (`http://192.168.10.203:8001`) - Business logic & database
3. **NextPanel Servers** - Hosting control panels (one or multiple)

---

## Prerequisites

### 1. NextPanel Server Setup

Your NextPanel server must have:
- ✅ Billing API enabled
- ✅ API credentials (API Key + API Secret)
- ✅ Health check endpoint (`/api/health`)
- ✅ Account provisioning endpoint (`/api/v1/billing/accounts`)

### 2. Get NextPanel API Credentials

On your NextPanel server:

1. Login as admin
2. Go to **Settings → API Keys**
3. Click **"Create New API Key"**
4. Set permission level to: **BILLING**
5. Copy the credentials:
   - API Key: `npk_xxxxxxxxxxxxx`
   - API Secret: `nps_xxxxxxxxxxxxx`

---

## Step-by-Step: Manual Provisioning

This is the recommended way to provision hosting accounts manually through the admin interface.

### Step 1: Add NextPanel Server to Billing System

1. **Login to Billing Admin**
   ```
   URL: http://192.168.10.203:4000/login
   Credentials: admin@test.com / Admin123!
   ```

2. **Navigate to Server Management**
   ```
   Dashboard → Server → Add Server
   ```

3. **Fill in Server Details**
   ```
   Server Name:    Production Server 1
   Description:    Main hosting server
   Base URL:       http://192.168.10.203:3000
   API Key:        npk_xxxxxxxxxxxxx
   API Secret:     nps_xxxxxxxxxxxxx
   Capacity:       100 (max accounts)
   Location:       US-East (optional)
   ```

4. **Test Connection**
   - Click **"Test Connection"** button
   - You should see: ✅ "Connection successful! Server is online."

5. **Save Server**
   - Click **"Add Server"**
   - Server will appear in the server list

### Step 2: Create or Select a Customer

#### Option A: Create New Customer

1. Go to **Dashboard → Customers → Add Customer**
2. Fill in customer details:
   ```
   Email:          customer@example.com
   Full Name:      John Doe
   Company:        Acme Inc
   Password:       SecurePassword123!
   ```
3. Click **"Create Customer"**

#### Option B: Use Existing Customer

1. Go to **Dashboard → Customers**
2. Find the customer in the list
3. Click **"View Details"** (👁️ icon)

### Step 3: Add a Product/License to Customer

1. In customer details page, click **"Add Product"**
2. Select a plan:
   ```
   Plan:           Professional Hosting
   Billing Cycle:  Monthly / Yearly
   ```
3. Click **"Add Product"**
4. A license will be created automatically

### Step 4: Provision NextPanel Account

Now you have two options:

#### Option A: Using Backend API Directly

```bash
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/provision \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "username": "johndoe",
    "email": "customer@example.com",
    "password": "TempPassword123!",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "company": "Acme Inc",
    "package_id": 1,
    "server_id": 1
  }'
```

#### Option B: Through Admin UI (Coming Soon)

Currently, there's no frontend UI for the provisioning step. Let me create one for you!

---

## Step-by-Step: Automated Flow

This is how the system should work automatically when a customer purchases hosting:

### Purchase Flow

```
1. Customer visits website → Browses hosting plans
2. Customer registers → Creates account
3. Customer purchases plan → Stripe processes payment
4. Payment succeeds → Webhook triggers
5. System creates license → Auto-assigns quotas
6. System provisions account → Calls NextPanel API
7. System sends email → Customer receives credentials
8. Customer logs into NextPanel → Starts using hosting
```

### Implementation (Currently Partial)

The system has:
- ✅ Customer registration
- ✅ License creation
- ✅ NextPanel server management
- ✅ Provisioning API endpoint
- ⚠️ **Missing:** Automated provisioning on payment
- ⚠️ **Missing:** Frontend UI for provisioning
- ⚠️ **Missing:** Email notifications

---

## API Reference

### 1. Test NextPanel Server Connection

```http
POST /api/v1/nextpanel/servers/test
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Test Server",
  "base_url": "http://192.168.10.203:3000",
  "api_key": "npk_xxxxx",
  "api_secret": "nps_xxxxx",
  "capacity": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful! Server is online.",
  "url": "http://192.168.10.203:3000"
}
```

### 2. Add NextPanel Server

```http
POST /api/v1/nextpanel/servers
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Production Server 1",
  "description": "Main hosting server",
  "base_url": "http://192.168.10.203:3000",
  "api_key": "npk_xxxxx",
  "api_secret": "nps_xxxxx",
  "capacity": 100,
  "location": "US-East"
}
```

### 3. List NextPanel Servers

```http
GET /api/v1/nextpanel/servers
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Production Server 1",
    "base_url": "http://192.168.10.203:3000",
    "is_active": true,
    "is_online": true,
    "capacity": 100,
    "current_accounts": 5,
    "utilization_percent": 5.0,
    "available_slots": 95,
    "location": "US-East",
    "created_at": "2025-10-12T00:00:00"
  }
]
```

### 4. Get Server Status

```http
GET /api/v1/nextpanel/servers/status
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "server_id": "1",
    "name": "Production Server 1",
    "url": "http://192.168.10.203:3000",
    "is_active": true,
    "is_online": true,
    "current_accounts": 5,
    "capacity": 100,
    "utilization": 5.0
  }
]
```

### 5. Provision Hosting Account

```http
POST /api/v1/nextpanel/provision
Content-Type: application/json
Authorization: Bearer <token>

{
  "customer_id": 1,
  "username": "johndoe",
  "email": "customer@example.com",
  "password": "TempPassword123!",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "package_id": 1,
  "server_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "account_id": 123,
  "server_name": "Production Server 1",
  "server_url": "http://192.168.10.203:3000",
  "nextpanel_user_id": 456,
  "username": "johndoe"
}
```

### 6. Get Provisioned Accounts

```http
GET /api/v1/customers/{customer_id}
Authorization: Bearer <token>
```

This will show customer details including all their licenses and provisioned accounts.

---

## Workflow Diagram

### Complete Customer Journey

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Admin Setup                                                │
│    └─ Add NextPanel server(s) to billing system             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Customer Registration                                      │
│    └─ Customer creates account on billing website           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Purchase Hosting Plan                                      │
│    ├─ Customer selects plan (Starter/Pro/Enterprise)        │
│    └─ Stripe processes payment                               │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. License Creation (Automatic)                               │
│    ├─ Generate license key (NP-XXXX-XXXX-XXXX)             │
│    ├─ Set quotas (databases, domains, emails)               │
│    └─ Create subscription record                             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Account Provisioning (Manual or Automatic)                │
│    ├─ Billing calls NextPanel API                           │
│    ├─ NextPanel creates hosting account                      │
│    └─ Returns credentials                                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Send Credentials (Email)                                   │
│    ├─ NextPanel URL                                          │
│    ├─ Username                                                │
│    ├─ Temporary password                                      │
│    └─ License key                                             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Customer Uses NextPanel                                    │
│    ├─ Creates websites                                        │
│    ├─ Manages databases                                       │
│    ├─ Sets up email accounts                                  │
│    └─ NextPanel validates quota with billing API            │
└──────────────────────────────────────────────────────────────┘
```

---

## Quick Start Commands

### 1. Check Backend is Running

```bash
curl http://192.168.10.203:8001/health
```

### 2. Get Auth Token

```bash
curl -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

Save the `access_token` from the response.

### 3. List NextPanel Servers

```bash
curl http://192.168.10.203:8001/api/v1/nextpanel/servers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create Test Customer

```bash
curl -X POST http://192.168.10.203:8001/api/v1/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testcustomer@example.com",
    "full_name": "Test Customer",
    "company_name": "Test Corp",
    "password": "Password123!",
    "is_active": true
  }'
```

### 5. Provision Account for Customer

```bash
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/provision \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 2,
    "username": "testuser",
    "email": "testcustomer@example.com",
    "password": "TempPass123!",
    "full_name": "Test Customer",
    "server_id": 1
  }'
```

---

## Troubleshooting

### Issue: "Server not found" or "No available servers"

**Solution:**
1. Make sure you've added at least one NextPanel server
2. Check server status: `GET /api/v1/nextpanel/servers/status`
3. Verify server is online and has available capacity

### Issue: "Connection failed" when testing server

**Possible Causes:**
1. ❌ NextPanel server is not running
2. ❌ Wrong URL (check protocol: http vs https)
3. ❌ Firewall blocking connection
4. ❌ Invalid API credentials

**Solution:**
```bash
# Test direct connection to NextPanel
curl http://192.168.10.203:3000/api/health

# Should return: {"status": "ok"}
```

### Issue: "Account creation failed"

**Check NextPanel Logs:**
```bash
# On NextPanel server
tail -f /path/to/nextpanel/logs/app.log
```

**Common Causes:**
1. Username already exists
2. Invalid package_id
3. API permissions insufficient
4. Database connection issue on NextPanel

### Issue: "Authentication failed"

**Solution:**
1. Get fresh auth token
2. Check if token is expired (24 hours)
3. Verify user is admin (for admin endpoints)

---

## Next Steps

### Recommended Improvements

1. **Create Frontend UI for Provisioning**
   - Add "Provision Account" button in customer details
   - Form to enter username, password, server selection
   - Show provisioned accounts list

2. **Automated Provisioning on Payment**
   - Hook into Stripe webhook
   - Auto-provision after successful payment
   - Send welcome email with credentials

3. **Account Management Features**
   - Suspend/Unsuspend accounts
   - View account usage statistics
   - Upgrade/Downgrade plans
   - Account termination

4. **Email Notifications**
   - Welcome email with credentials
   - Expiry warnings
   - Renewal reminders
   - Suspension notifications

5. **Monitoring & Alerts**
   - Server health checks
   - Capacity alerts (>90% full)
   - Failed provisioning alerts
   - Usage quota warnings

---

## Example: Complete Manual Workflow

Here's a complete example of manually provisioning an account:

### 1. Add Server (One Time Setup)

```bash
# Login
TOKEN=$(curl -s -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.access_token')

# Add server
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "base_url": "http://192.168.10.203:3000",
    "api_key": "npk_your_key_here",
    "api_secret": "nps_your_secret_here",
    "capacity": 100,
    "location": "US-East"
  }'
```

### 2. Create Customer

```bash
# Create customer
CUSTOMER_RESPONSE=$(curl -s -X POST http://192.168.10.203:8001/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "full_name": "John Doe",
    "company_name": "Acme Corp",
    "password": "CustomerPass123!",
    "is_active": true
  }')

CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.id')
echo "Customer ID: $CUSTOMER_ID"
```

### 3. Add License to Customer

```bash
# Get a plan ID first
PLANS=$(curl -s http://192.168.10.203:8001/api/v1/plans \
  -H "Authorization: Bearer $TOKEN")
PLAN_ID=$(echo $PLANS | jq -r '.[0].id')

# Add license
curl -X POST http://192.168.10.203:8001/api/v1/customers/$CUSTOMER_ID/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"billing_cycle\": \"monthly\",
    \"create_subscription\": true
  }"
```

### 4. Provision NextPanel Account

```bash
# Provision hosting account
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CUSTOMER_ID,
    \"username\": \"johndoe\",
    \"email\": \"john@example.com\",
    \"password\": \"TempHosting123!\",
    \"full_name\": \"John Doe\",
    \"company\": \"Acme Corp\",
    \"server_id\": 1
  }"
```

### 5. Verify Account Created

```bash
# Check customer details
curl http://192.168.10.203:8001/api/v1/customers/$CUSTOMER_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Check server status
curl http://192.168.10.203:8001/api/v1/nextpanel/servers/status \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## Support

For issues or questions:
1. Check backend logs: `tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log`
2. Check NextPanel logs on the hosting server
3. Review API documentation: `http://192.168.10.203:8001/docs`

---

**Last Updated:** October 12, 2025
**System Version:** 1.0.0

