# NextPanel Billing Integration Guide

## Overview

Your billing system (`nextpanel-bill`) can now manage **multiple NextPanel servers** and automatically provision hosting accounts when customers purchase plans.

## Architecture

```
┌──────────────────────────────────────┐
│   Billing System Frontend            │
│   (Customer purchases hosting)       │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│   Billing System Backend             │
│   • Create order                     │
│   • Process payment                  │
│   • Call NextPanel API               │
└────────────────┬─────────────────────┘
                 │
         ┌───────┴────────┬─────────┐
         │                │         │
         ▼                ▼         ▼
┌──────────────┐  ┌──────────┐  ┌──────────┐
│ NextPanel 1  │  │NextPanel 2│  │NextPanel 3│
│ (Server A)   │  │(Server B) │  │(Server C) │
│ API Key Auth │  │API Key Auth│  │API Key Auth│
│ 50 accounts  │  │75 accounts│  │30 accounts│
└──────────────┘  └──────────┘  └──────────┘
```

## Setup Steps

### Step 1: Set Up NextPanel API Keys

For each NextPanel server:

1. Login to NextPanel as admin
2. Navigate to API Keys section
3. Create new API key:
   - Name: "Billing System"
   - Permission: **BILLING**
   - IP Whitelist: Your billing server IP
   - Rate Limit: 1000/hour

4. **Save the credentials immediately!**
   - Key ID: `npk_xxxxx...`
   - Secret: `nps_yyyyy...`

### Step 2: Add Server to Billing System

```bash
curl -X POST http://localhost:8000/api/v1/nextpanel/servers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "NextPanel Server 1",
    "description": "Primary hosting server - US East",
    "base_url": "http://192.168.10.203:9000",
    "api_key": "npk_xxxxx...",
    "api_secret": "nps_yyyyy...",
    "capacity": 100,
    "location": "US-East",
    "tags": ["primary", "managed"]
  }'
```

### Step 3: Update Main API Router

Edit `/home/saiful/nextpanel-bill/billing-backend/app/api/v1/__init__.py`:

```python
from fastapi import APIRouter
from app.api.v1 import nextpanel  # Add this import

router = APIRouter()

# Include NextPanel routes
router.include_router(nextpanel.router)

# ... other routers ...
```

### Step 4: Apply Database Migration

```bash
cd /home/saiful/nextpanel-bill/billing-backend

# Apply migration
alembic upgrade head
```

### Step 5: Initialize Service on Startup

Edit `/home/saiful/nextpanel-bill/billing-backend/app/main.py`:

```python
from app.services.nextpanel_service import get_nextpanel_service
from app.models.nextpanel_server import NextPanelServer

@app.on_event("startup")
async def startup_event():
    """Load NextPanel servers on startup"""
    from app.core.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Load all servers from database
        servers = db.query(NextPanelServer).filter(
            NextPanelServer.is_active == True
        ).all()
        
        nextpanel_service = get_nextpanel_service()
        
        for server in servers:
            nextpanel_service.add_server(
                server_id=str(server.id),
                name=server.name,
                base_url=server.base_url,
                api_key=server.api_key,
                api_secret=server.api_secret,
                capacity=server.capacity
            )
        
        logger.info(f"Loaded {len(servers)} NextPanel servers")
    finally:
        db.close()
```

## Usage Examples

### 1. Check Server Status

```bash
curl http://localhost:8000/api/v1/nextpanel/servers/status
```

Response:
```json
[
  {
    "server_id": "1",
    "name": "NextPanel Server 1",
    "url": "http://192.168.10.203:9000",
    "is_active": true,
    "is_online": true,
    "current_accounts": 50,
    "capacity": 100,
    "utilization": 50.0
  }
]
```

### 2. Provision Account (When Customer Purchases)

```bash
curl -X POST http://localhost:8000/api/v1/nextpanel/provision \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 123,
    "order_id": 456,
    "username": "customer1",
    "email": "customer@example.com",
    "password": "SecurePass123!",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "package_id": 1
  }'
```

Response:
```json
{
  "success": true,
  "account_id": 789,
  "server_name": "NextPanel Server 1",
  "server_url": "http://192.168.10.203:9000",
  "nextpanel_user_id": 42,
  "username": "customer1"
}
```

### 3. Suspend Account (Payment Overdue)

```bash
curl -X POST http://localhost:8000/api/v1/nextpanel/accounts/789/suspend \
  -H "Content-Type: application/json" \
  -d '{"reason": "Payment overdue"}'
```

### 4. Unsuspend Account (Payment Received)

```bash
curl -X POST http://localhost:8000/api/v1/nextpanel/accounts/789/unsuspend
```

### 5. Get Account Statistics

```bash
curl http://localhost:8000/api/v1/nextpanel/accounts/789/stats
```

Response:
```json
{
  "user_id": 42,
  "username": "customer1",
  "email": "customer@example.com",
  "total_domains": 3,
  "total_databases": 5,
  "total_email_accounts": 10,
  "total_ssl_certificates": 2,
  "storage_used": 0,
  "last_login": "2025-10-11T10:30:00",
  "account_age_days": 30
}
```

### 6. Delete Account (Customer Cancels)

```bash
curl -X DELETE http://localhost:8000/api/v1/nextpanel/accounts/789
```

## Integration with Order System

### Option 1: Webhook Approach

When order status changes to "paid":

```python
from app.services.nextpanel_service import get_nextpanel_service

async def on_order_paid(order):
    """Called when order is marked as paid"""
    
    # Provision hosting account
    nextpanel_service = get_nextpanel_service()
    
    result = nextpanel_service.create_account(
        username=order.customer.username,
        email=order.customer.email,
        password=generate_random_password(),
        full_name=order.customer.full_name,
        billing_customer_id=str(order.customer_id)
    )
    
    if result['success']:
        # Save account details
        account = NextPanelAccount(
            customer_id=order.customer_id,
            order_id=order.id,
            server_id=result['server_id'],
            nextpanel_user_id=result['nextpanel_user_id'],
            username=result['account']['username'],
            email=result['account']['email']
        )
        db.add(account)
        db.commit()
        
        # Send welcome email to customer
        send_welcome_email(
            order.customer.email,
            username=result['account']['username'],
            panel_url=result['server_url']
        )
```

### Option 2: Direct Integration in Order API

```python
@router.post("/orders/{order_id}/pay")
async def mark_order_paid(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(404, "Order not found")
    
    # Mark as paid
    order.status = "paid"
    order.paid_at = datetime.utcnow()
    
    # Provision hosting account
    if order.product.type == "hosting":
        result = await provision_hosting_account(
            customer_id=order.customer_id,
            order_id=order.id,
            username=order.customer.username,
            email=order.customer.email,
            password=generate_password()
        )
        
        if not result['success']:
            raise HTTPException(500, f"Provisioning failed: {result['error']}")
    
    db.commit()
    return {"message": "Order paid and provisioned successfully"}
```

## Automated Suspension/Unsuspension

Set up a cron job or scheduler:

```python
from app.services.nextpanel_service import get_nextpanel_service
from app.models.nextpanel_server import NextPanelAccount
from datetime import datetime, timedelta

async def check_overdue_accounts():
    """Run daily to suspend overdue accounts"""
    
    db = SessionLocal()
    nextpanel_service = get_nextpanel_service()
    
    # Find all active accounts with overdue invoices
    overdue_accounts = db.query(NextPanelAccount).join(Order).filter(
        Order.status == "overdue",
        NextPanelAccount.status == "active"
    ).all()
    
    for account in overdue_accounts:
        # Suspend account
        success = nextpanel_service.suspend_account(
            server_id=str(account.server_id),
            user_id=account.nextpanel_user_id,
            reason="Payment overdue"
        )
        
        if success:
            account.status = "suspended"
            account.suspended_at = datetime.utcnow()
            
            # Send suspension notice
            send_suspension_email(account)
    
    db.commit()
    db.close()
```

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/nextpanel/servers` | POST | Add new server |
| `/nextpanel/servers` | GET | List all servers |
| `/nextpanel/servers/status` | GET | Get server status |
| `/nextpanel/provision` | POST | Create hosting account |
| `/nextpanel/accounts/{id}/suspend` | POST | Suspend account |
| `/nextpanel/accounts/{id}/unsuspend` | POST | Unsuspend account |
| `/nextpanel/accounts/{id}` | DELETE | Delete account |
| `/nextpanel/accounts/{id}/stats` | GET | Get usage statistics |

## Load Balancing

The system automatically distributes accounts across servers:

1. **Auto-Selection**: Finds server with most available capacity
2. **Health Checks**: Only uses online servers
3. **Capacity Management**: Respects server limits
4. **Manual Override**: Can specify server_id if needed

## Monitoring & Alerts

Set up monitoring for:

1. **Server Health**: Check `/servers/status` regularly
2. **Capacity Alerts**: Alert when server >80% full
3. **Failed Provisions**: Log and alert on errors
4. **Suspension Failures**: Manual follow-up needed

## Security Considerations

1. **Encrypt API Secrets**: Use encryption for `api_secret` column
2. **Rotate Keys**: Regularly rotate NextPanel API keys
3. **Audit Logs**: Log all account operations
4. **IP Whitelist**: Restrict NextPanel API keys to billing server IP
5. **Rate Limiting**: Monitor rate limit usage

## Troubleshooting

### "Failed to connect to NextPanel server"
- Check base_url is correct (include protocol)
- Verify API key and secret
- Check firewall allows connection
- Test: `curl http://panel-url:9000/api/health`

### "Server not available"
- Check server capacity (current_accounts < capacity)
- Verify server is_active and is_online
- Check `/servers/status` endpoint

### "Account creation failed"
- Username or email already exists
- Invalid data format
- Server connection lost mid-request

## Testing

1. **Add Test Server**:
```bash
curl -X POST http://localhost:8000/api/v1/nextpanel/servers \
  -d '{"name":"Test Server","base_url":"http://localhost:9000",...}'
```

2. **Test Provision**:
```bash
curl -X POST http://localhost:8000/api/v1/nextpanel/provision \
  -d '{"customer_id":1,"username":"testuser","email":"test@test.com",...}'
```

3. **Test Suspend/Unsuspend**:
```bash
curl -X POST http://localhost:8000/api/v1/nextpanel/accounts/1/suspend
curl -X POST http://localhost:8000/api/v1/nextpanel/accounts/1/unsuspend
```

## Next Steps

1. ✅ Complete database migration
2. ✅ Add servers via API
3. ✅ Test account provisioning
4. ✅ Integrate with order workflow
5. ✅ Set up automated suspension
6. ✅ Configure monitoring
7. ✅ Add encryption for secrets
8. ✅ Create admin UI for server management

## Support

- **NextPanel API Docs**: `/home/saiful/nextPanel/API_KEY_SYSTEM.md`
- **Quick Reference**: `/home/saiful/nextPanel/API_KEY_QUICKSTART.md`
- **Architecture**: `/home/saiful/nextPanel/API_KEY_ARCHITECTURE.md`

---

**You can now sell hosting on multiple NextPanel servers automatically! 🚀**

