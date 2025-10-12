# Quick NextPanel Account Provisioning Reference

## 🚀 Quick Start (3 Steps)

### Step 1: Add NextPanel Server (One-Time Setup)

**Via Admin UI:**
1. Login: `http://192.168.10.203:4000`
2. Go to: **Server** → **Add Server**
3. Fill in details and click **Test Connection**
4. Click **Add Server**

**Via API:**
```bash
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/servers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Server",
    "base_url": "http://192.168.10.203:3000",
    "api_key": "npk_xxxxx",
    "api_secret": "nps_xxxxx",
    "capacity": 100
  }'
```

---

### Step 2: Create Customer & Add License

**Via Admin UI:**
1. Go to: **Customers** → **Add Customer**
2. Fill in details → **Create**
3. View customer → **Add Product** → Select plan

**Via API:**
```bash
# Create customer
curl -X POST http://192.168.10.203:8001/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "full_name": "John Doe",
    "password": "SecurePass123!",
    "is_active": true
  }'

# Add license (use customer_id from response)
curl -X POST http://192.168.10.203:8001/api/v1/customers/CUSTOMER_ID/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PLAN_ID",
    "billing_cycle": "monthly",
    "create_subscription": true
  }'
```

---

### Step 3: Provision Hosting Account

**Via API:**
```bash
curl -X POST http://192.168.10.203:8001/api/v1/nextpanel/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "username": "johndoe",
    "email": "customer@example.com",
    "password": "HostingPass123!",
    "full_name": "John Doe",
    "server_id": 1
  }'
```

**Note:** Currently no UI for this step. Use API or wait for UI implementation.

---

## 📊 Check Status

### Get Auth Token
```bash
curl -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.access_token'
```

### List Servers
```bash
curl http://192.168.10.203:8001/api/v1/nextpanel/servers \
  -H "Authorization: Bearer TOKEN"
```

### Server Status
```bash
curl http://192.168.10.203:8001/api/v1/nextpanel/servers/status \
  -H "Authorization: Bearer TOKEN"
```

### List Customers
```bash
curl http://192.168.10.203:8001/api/v1/customers \
  -H "Authorization: Bearer TOKEN"
```

### Get Customer Details
```bash
curl http://192.168.10.203:8001/api/v1/customers/CUSTOMER_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔧 Useful Commands

### Complete Example (All in One)
```bash
#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://192.168.10.203:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.access_token')

# Create customer
CUSTOMER=$(curl -s -X POST http://192.168.10.203:8001/api/v1/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcustomer@example.com",
    "full_name": "New Customer",
    "password": "Password123!",
    "is_active": true
  }')

CUSTOMER_ID=$(echo $CUSTOMER | jq -r '.id')
echo "Created customer ID: $CUSTOMER_ID"

# Get first plan
PLAN_ID=$(curl -s http://192.168.10.203:8001/api/v1/plans \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.[0].id')
echo "Using plan ID: $PLAN_ID"

# Add license
curl -s -X POST http://192.168.10.203:8001/api/v1/customers/$CUSTOMER_ID/licenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"plan_id\": \"$PLAN_ID\",
    \"billing_cycle\": \"monthly\",
    \"create_subscription\": true
  }" | jq '.'

# Provision account
curl -s -X POST http://192.168.10.203:8001/api/v1/nextpanel/provision \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CUSTOMER_ID,
    \"username\": \"newuser_$(date +%s)\",
    \"email\": \"newcustomer@example.com\",
    \"password\": \"Hosting123!\",
    \"full_name\": \"New Customer\",
    \"server_id\": 1
  }" | jq '.'

echo "Done! Account provisioned."
```

Save this as `provision_account.sh`, make it executable with `chmod +x provision_account.sh`, and run it!

---

## 🐛 Quick Troubleshooting

### Backend not responding?
```bash
curl http://192.168.10.203:8001/health
# Should return: {"status":"healthy",...}
```

### Check backend logs:
```bash
tail -f /home/saiful/nextpanel-bill/billing-backend/backend.log
```

### Restart backend:
```bash
cd /home/saiful/nextpanel-bill/billing-backend
fuser -k 8001/tcp 2>/dev/null || true
sleep 2
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload > backend.log 2>&1 &
```

### Test NextPanel server directly:
```bash
curl http://192.168.10.203:3000/api/health
# Should return: {"status": "ok"}
```

---

## 📚 Documentation

- **Full Guide:** `NEXTPANEL_ACCOUNT_PROVISIONING_GUIDE.md`
- **API Docs:** `http://192.168.10.203:8001/docs`
- **ReDoc:** `http://192.168.10.203:8001/redoc`

---

## 🎯 Next Steps

1. ✅ **Done:** Test server connection
2. ✅ **Done:** Create customers via UI
3. ⚠️ **TODO:** Add provisioning UI (currently API only)
4. ⚠️ **TODO:** Automated provisioning on payment
5. ⚠️ **TODO:** Email notifications
6. ⚠️ **TODO:** Account management (suspend/unsuspend)

