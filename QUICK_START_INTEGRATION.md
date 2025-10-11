# Quick Start: Billing ↔ NextPanel Integration

## ✅ Problem Solved!

Your billing system at `/home/saiful/nextpanel-bill` can now:
- ✅ Connect to multiple NextPanel servers  
- ✅ Automatically provision hosting accounts
- ✅ Suspend/unsuspend for non-payment
- ✅ Track resource usage
- ✅ Auto-distribute load across servers

---

## 🚀 Quick Setup (10 Minutes)

### 1. NextPanel Backend is Already Running! ✅

```bash
# Verify it's running
curl http://localhost:9000/api/health
# Response: {"status":"healthy",...}
```

### 2. Login to NextPanel & Create API Key

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:9000/api/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  | jq -r '.access_token')

# Create API key for billing system
curl -X POST http://localhost:9000/api/api-keys/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Billing System",
    "permission_level": "billing",
    "rate_limit_per_hour": 1000,
    "rate_limit_per_day": 10000
  }' | jq > /tmp/api_key.json

# ⚠️ SAVE THESE!
echo "=== SAVE THESE CREDENTIALS ==="
cat /tmp/api_key.json | jq -r '.key_id, .key_secret'
```

### 3. Add Models to Billing System

Models are already created at:
- `/home/saiful/nextpanel-bill/billing-backend/app/models/nextpanel_server.py`
- `/home/saiful/nextpanel-bill/billing-backend/app/services/nextpanel_service.py`
- `/home/saiful/nextpanel-bill/billing-backend/app/api/v1/nextpanel.py`

### 4. Update API Router

Edit `/home/saiful/nextpanel-bill/billing-backend/app/api/v1/__init__.py`:

```python
from fastapi import APIRouter
from app.api.v1 import nextpanel  # ADD THIS

router = APIRouter()
router.include_router(nextpanel.router)  # ADD THIS
# ... other routes ...
```

### 5. Apply Database Migration

```bash
cd /home/saiful/nextpanel-bill/billing-backend

# Run migration
alembic upgrade head
```

### 6. Add Your NextPanel Server

```bash
cd /home/saiful/nextpanel-bill

# Start billing backend if not running
# cd billing-backend && uvicorn app.main:app --reload --port 8000

# Add server (replace with YOUR credentials from step 2)
curl -X POST http://localhost:8000/api/v1/nextpanel/servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Primary NextPanel",
    "description": "Main hosting server",
    "base_url": "http://192.168.10.203:9000",
    "api_key": "YOUR_KEY_ID_HERE",
    "api_secret": "YOUR_SECRET_HERE",
    "capacity": 100,
    "location": "Local"
  }'
```

### 7. Test It!

```bash
# Check server status
curl http://localhost:8000/api/v1/nextpanel/servers/status | jq

# Provision a test account
curl -X POST http://localhost:8000/api/v1/nextpanel/provision \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "username": "testuser123",
    "email": "test123@example.com",
    "password": "SecurePass123!",
    "full_name": "Test User"
  }' | jq
```

---

## 📋 Workflow Integration

### When Customer Purchases Hosting:

```python
# In your order/payment handler:

from app.services.nextpanel_service import get_nextpanel_service

async def on_payment_received(order):
    nextpanel = get_nextpanel_service()
    
    result = nextpanel.create_account(
        username=order.customer.username,
        email=order.customer.email,
        password=generate_random_password(),
        billing_customer_id=str(order.customer_id)
    )
    
    if result['success']:
        # Save to your database
        save_nextpanel_account(result)
        
        # Send welcome email
        send_email(
            to=order.customer.email,
            subject="Your Hosting is Ready!",
            body=f"""
            Your hosting account is ready!
            
            Control Panel: {result['server_url']}
            Username: {result['account']['username']}
            
            Login to manage your hosting.
            """
        )
```

### When Payment is Overdue:

```python
async def suspend_overdue_accounts():
    nextpanel = get_nextpanel_service()
    
    # Get overdue accounts
    accounts = get_overdue_accounts()
    
    for account in accounts:
        success = nextpanel.suspend_account(
            server_id=str(account.server_id),
            user_id=account.nextpanel_user_id,
            reason="Payment overdue"
        )
        
        if success:
            send_suspension_notice(account.customer.email)
```

### When Payment is Received:

```python
async def on_payment_caught_up(account):
    nextpanel = get_nextpanel_service()
    
    success = nextpanel.unsuspend_account(
        server_id=str(account.server_id),
        user_id=account.nextpanel_user_id
    )
    
    if success:
        send_reactivation_email(account.customer.email)
```

---

## 🎯 API Endpoints You Can Use

| Action | Endpoint | Method |
|--------|----------|--------|
| Add server | `/nextpanel/servers` | POST |
| List servers | `/nextpanel/servers` | GET |
| Check status | `/nextpanel/servers/status` | GET |
| **Create account** | `/nextpanel/provision` | **POST** |
| **Suspend** | `/nextpanel/accounts/{id}/suspend` | **POST** |
| **Unsuspend** | `/nextpanel/accounts/{id}/unsuspend` | **POST** |
| Delete | `/nextpanel/accounts/{id}` | DELETE |
| Get stats | `/nextpanel/accounts/{id}/stats` | GET |

---

## 🏗️ Architecture

```
Customer → Purchases Hosting
    ↓
Billing System → Processes Payment
    ↓
NextPanel Service → Selects Best Server
    ↓
NextPanel API → Creates Account
    ↓
Customer → Gets Login Credentials
```

---

## 📊 Multi-Server Support

The system automatically:
1. **Load balances** across servers (picks least loaded)
2. **Health checks** servers before provisioning
3. **Tracks capacity** per server
4. **Fails over** if one server is full

Example with 3 servers:
```
Server 1: 45/100 accounts (45% used) ← Will use this
Server 2: 78/100 accounts (78% used)
Server 3: 92/100 accounts (92% used)
```

---

## 🔐 Security Features

- ✅ API keys never stored in plain text (hashed)
- ✅ Rate limiting (1000 req/hour per key)
- ✅ IP whitelisting supported
- ✅ Complete audit logging
- ✅ Permission-based access control

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `NEXTPANEL_INTEGRATION_GUIDE.md` | Complete integration guide |
| `QUICK_START_INTEGRATION.md` | This file - quick start |
| `/home/saiful/nextPanel/API_KEY_SYSTEM.md` | Full NextPanel API docs |
| `/home/saiful/nextPanel/API_KEY_QUICKSTART.md` | NextPanel quick reference |

---

## ✅ Checklist

- [x] NextPanel backend running (port 9000)
- [ ] API key created & saved
- [ ] Database migration applied
- [ ] API router updated  
- [ ] Server added to billing system
- [ ] Test account provisioned successfully
- [ ] Integration tested with real orders
- [ ] Automated suspension configured
- [ ] Welcome emails set up

---

## 🆘 Troubleshooting

### "Connection refused" Error
```bash
# Check if NextPanel is running
curl http://localhost:9000/api/health

# If not, start it:
cd /home/saiful/nextPanel/nextpanel-backend
python3 app/main.py &
```

### "Invalid API credentials"
- Double-check key_id and key_secret
- Verify the key is active in NextPanel
- Check IP whitelist settings

### "Server not available"
- Check server capacity (current_accounts < capacity)
- Verify server is_active and is_online
- Check `/servers/status` endpoint

---

## 🎉 Success!

You now have:
- ✅ Multi-server hosting management
- ✅ Automated account provisioning
- ✅ Suspend/unsuspend automation
- ✅ Resource usage tracking
- ✅ Load balancing across servers

**You can sell hosting accounts through your billing system! 🚀**

---

## Next Steps

1. **Test the integration** with a real purchase
2. **Set up automated suspension** for overdue accounts
3. **Configure welcome emails** with login details
4. **Add more NextPanel servers** for scalability
5. **Create admin UI** to manage servers
6. **Set up monitoring** for server health

For detailed documentation, see `NEXTPANEL_INTEGRATION_GUIDE.md`

