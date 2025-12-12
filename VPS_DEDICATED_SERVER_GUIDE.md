# 🖥️ Complete Guide: Selling VPS & Dedicated Servers

## 📋 Table of Contents
1. [Overview](#overview)
2. [Approach Options](#approach-options)
3. [Recommended Solution](#recommended-solution)
4. [Implementation Steps](#implementation-steps)
5. [Product Setup](#product-setup)
6. [Provisioning Integration](#provisioning-integration)
7. [Best Practices](#best-practices)

---

## 🎯 Overview

Your billing system currently supports:
- ✅ **Shared Hosting** - Auto-provisioned via NextPanel
- ✅ **Reseller Hosting** - Auto-provisioned via NextPanel
- ⚠️ **VPS/Dedicated** - Currently manual workflow

This guide shows you the **best ways** to sell and provision VPS/Dedicated servers.

---

## 🚀 Approach Options

### **Option 1: Manual Provisioning (Current)**
**Best for:** Small scale, custom configurations, high-margin services

**How it works:**
1. Customer orders VPS/Dedicated server product
2. Order creates customer record + subscription
3. Admin manually provisions server (via provider panel)
4. Admin sends credentials to customer

**Pros:**
- ✅ Full control over server allocation
- ✅ Can offer custom configurations
- ✅ No integration complexity
- ✅ Works with any provider

**Cons:**
- ❌ Not scalable (requires manual work)
- ❌ Slower delivery time
- ❌ Higher operational overhead

---

### **Option 2: Automated via Cloud Provider API**
**Best for:** Medium to large scale, standardized configurations

**How it works:**
1. Customer orders VPS/Dedicated server
2. System calls cloud provider API (DigitalOcean, Linode, Vultr, etc.)
3. Server automatically provisioned
4. Credentials sent to customer automatically

**Pros:**
- ✅ Fully automated
- ✅ Fast delivery (minutes)
- ✅ Scalable
- ✅ Professional experience

**Cons:**
- ❌ Requires API integration
- ❌ Limited to provider's configurations
- ❌ API costs may apply

**Supported Providers:**
- DigitalOcean
- Linode (Akamai)
- Vultr
- Hetzner
- AWS EC2
- Google Cloud Compute
- Azure Virtual Machines
- OVH
- Contabo

---

### **Option 3: Hybrid Approach (Recommended)**
**Best for:** Most businesses - flexibility + automation

**How it works:**
1. Standard VPS plans → Automated provisioning
2. Custom Dedicated servers → Manual provisioning
3. High-end configurations → Manual with approval workflow

**Pros:**
- ✅ Best of both worlds
- ✅ Automated for common plans
- ✅ Manual for special cases
- ✅ Flexible pricing

**Cons:**
- ⚠️ Requires managing two workflows

---

## 🏆 Recommended Solution: Hybrid Approach

### **Why Hybrid?**
1. **80/20 Rule**: 80% of orders are standard plans → automate these
2. **20% Custom**: High-margin custom servers → manual (more profit)
3. **Flexibility**: Can switch between automated/manual per product
4. **Scalability**: Grow without hiring more staff

---

## 📦 Implementation Steps

### **Step 1: Create VPS/Dedicated Server Products**

#### **Via Admin UI:**
1. Go to: **Products** → **Add Product**
2. Fill in details:
   - **Name**: "VPS - Starter"
   - **Category**: "Hosting"
   - **Type**: "VPS" or "Dedicated"
   - **Price Monthly**: $29.99
   - **Price Yearly**: $299.99
   - **Features**:
     ```json
     {
       "cpu": "2 vCPU",
       "ram": "4 GB",
       "storage": "80 GB SSD",
       "bandwidth": "2 TB",
       "os": "Ubuntu 22.04",
       "location": "US-East",
       "provisioning": "automated"
     }
     ```

#### **Via API:**
```bash
POST /api/v1/products
{
  "name": "VPS - Starter",
  "description": "Entry-level VPS for small projects",
  "category": "hosting",
  "type": "vps",
  "price_monthly": 29.99,
  "price_yearly": 299.99,
  "features": {
    "cpu": "2 vCPU",
    "ram": "4 GB",
    "storage": "80 GB SSD",
    "bandwidth": "2 TB",
    "provisioning": "automated"
  }
}
```

---

### **Step 2: Choose Provisioning Method**

#### **For Automated Provisioning:**

**A. DigitalOcean Integration (Recommended for beginners)**

**Setup:**
1. Create DigitalOcean account
2. Generate API token: https://cloud.digitalocean.com/account/api/tokens
3. Add to your system:

```python
# billing-backend/app/services/digitalocean_service.py
import requests

class DigitalOceanService:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api.digitalocean.com/v2"
    
    def create_droplet(self, name: str, region: str, size: str, image: str):
        """Create a new VPS (droplet) on DigitalOcean"""
        url = f"{self.base_url}/droplets"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        data = {
            "name": name,
            "region": region,  # e.g., "nyc1"
            "size": size,      # e.g., "s-2vcpu-4gb"
            "image": image     # e.g., "ubuntu-22-04-x64"
        }
        response = requests.post(url, json=data, headers=headers)
        return response.json()
    
    def get_droplet_info(self, droplet_id: int):
        """Get droplet information including IP address"""
        url = f"{self.base_url}/droplets/{droplet_id}"
        headers = {"Authorization": f"Bearer {self.api_token}"}
        response = requests.get(url, headers=headers)
        return response.json()
```

**B. Vultr Integration (Good pricing)**

```python
# billing-backend/app/services/vultr_service.py
import requests

class VultrService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.vultr.com/v2"
    
    def create_instance(self, plan: str, region: str, os_id: str):
        """Create VPS instance on Vultr"""
        url = f"{self.base_url}/instances"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "plan": plan,      # e.g., "vc2-2c-4gb"
            "region": region,  # e.g., "ewr"
            "os_id": os_id     # e.g., "387" (Ubuntu 22.04)
        }
        response = requests.post(url, json=data, headers=headers)
        return response.json()
```

**C. Hetzner Integration (Best value)**

```python
# billing-backend/app/services/hetzner_service.py
import requests

class HetznerService:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api.hetzner.cloud/v1"
    
    def create_server(self, name: str, server_type: str, image: str, location: str):
        """Create VPS on Hetzner Cloud"""
        url = f"{self.base_url}/servers"
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        data = {
            "name": name,
            "server_type": server_type,  # e.g., "cx21" (2 vCPU, 4GB RAM)
            "image": image,              # e.g., "ubuntu-22.04"
            "location": location          # e.g., "nbg1"
        }
        response = requests.post(url, json=data, headers=headers)
        return response.json()
```

---

### **Step 3: Create Provisioning API Endpoint**

```python
# billing-backend/app/api/v1/vps_provisioning.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.digitalocean_service import DigitalOceanService
from app.services.vultr_service import VultrService
from app.services.hetzner_service import HetznerService

router = APIRouter(prefix="/vps", tags=["VPS Provisioning"])

@router.post("/provision")
async def provision_vps(
    order_id: int,
    customer_id: str,
    provider: str,  # "digitalocean", "vultr", "hetzner"
    plan: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Automatically provision a VPS when customer orders
    
    This endpoint is called:
    1. When order is marked as paid
    2. Or manually by admin
    """
    
    # Get order details
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    
    # Get product features
    product = order.items[0]  # Assuming first item is VPS product
    features = product.get("features", {})
    
    # Map product to provider specs
    provider_specs = map_product_to_provider(plan, features)
    
    # Provision based on provider
    if provider == "digitalocean":
        service = DigitalOceanService(api_token=os.getenv("DO_API_TOKEN"))
        result = service.create_droplet(
            name=f"vps-{customer_id}-{order_id}",
            region=provider_specs["region"],
            size=provider_specs["size"],
            image=provider_specs["image"]
        )
    elif provider == "vultr":
        service = VultrService(api_key=os.getenv("VULTR_API_KEY"))
        result = service.create_instance(
            plan=provider_specs["plan"],
            region=provider_specs["region"],
            os_id=provider_specs["os_id"]
        )
    elif provider == "hetzner":
        service = HetznerService(api_token=os.getenv("HETZNER_API_TOKEN"))
        result = service.create_server(
            name=f"vps-{customer_id}-{order_id}",
            server_type=provider_specs["server_type"],
            image=provider_specs["image"],
            location=provider_specs["location"]
        )
    else:
        raise HTTPException(400, "Unsupported provider")
    
    # Save VPS details to database
    vps_account = VPSAccount(
        customer_id=customer_id,
        order_id=order_id,
        provider=provider,
        provider_instance_id=result["id"],
        ip_address=result.get("ip_address"),
        status="provisioning",
        credentials={
            "root_password": generate_password(),
            "ssh_key": result.get("ssh_key")
        }
    )
    db.add(vps_account)
    await db.commit()
    
    # Send credentials email to customer
    await send_vps_credentials_email(customer_id, vps_account)
    
    return {
        "success": True,
        "vps_id": vps_account.id,
        "ip_address": result.get("ip_address"),
        "status": "provisioning"
    }

def map_product_to_provider(plan: str, features: dict):
    """Map your product specs to provider-specific configurations"""
    # Example mapping
    mappings = {
        "vps-starter": {
            "digitalocean": {
                "size": "s-2vcpu-4gb",
                "region": "nyc1",
                "image": "ubuntu-22-04-x64"
            },
            "vultr": {
                "plan": "vc2-2c-4gb",
                "region": "ewr",
                "os_id": "387"
            },
            "hetzner": {
                "server_type": "cx21",
                "image": "ubuntu-22.04",
                "location": "nbg1"
            }
        }
    }
    return mappings.get(plan, {}).get("digitalocean", {})
```

---

### **Step 4: Create VPS Account Model**

```python
# billing-backend/app/models/vps_account.py
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class VPSAccount(Base):
    __tablename__ = "vps_accounts"
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(String(255), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    
    # Provider Information
    provider = Column(String(50), nullable=False)  # digitalocean, vultr, hetzner
    provider_instance_id = Column(String(100), nullable=False)
    
    # Server Details
    ip_address = Column(String(45), nullable=True)
    hostname = Column(String(255), nullable=True)
    region = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(20), default="provisioning")  # provisioning, active, suspended, deleted
    
    # Credentials (encrypted in production!)
    credentials = Column(JSON, nullable=True)  # root_password, ssh_key, etc.
    
    # Metadata
    specs = Column(JSON, nullable=True)  # cpu, ram, storage, bandwidth
    meta_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    provisioned_at = Column(DateTime, nullable=True)
    suspended_at = Column(DateTime, nullable=True)
```

---

### **Step 5: Auto-Provision on Order Payment**

```python
# billing-backend/app/api/v1/orders.py

@router.post("/{order_id}/mark-paid")
async def mark_order_paid(
    order_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Mark order as paid and auto-provision services"""
    
    order = await db.get(Order, order_id)
    order.status = "paid"
    await db.commit()
    
    # Check if order contains VPS/Dedicated server product
    for item in order.items:
        product = await get_product(item["product_id"], db)
        
        if product.type in ["vps", "dedicated"]:
            # Auto-provision if product has automated provisioning
            if product.features.get("provisioning") == "automated":
                await provision_vps(
                    order_id=order_id,
                    customer_id=order.customer_id,
                    provider=product.features.get("provider", "digitalocean"),
                    plan=product.slug,
                    db=db
                )
            else:
                # Manual provisioning - send notification to admin
                await notify_admin_for_manual_provisioning(order_id, product)
    
    return {"success": True, "message": "Order marked as paid"}
```

---

## 🎨 Frontend: VPS Management UI

### **Add VPS Tab to Customer Details**

```typescript
// billing-frontend/src/app/admin/customers/[id]/page.tsx

// Add new tab
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'vps', label: 'VPS Servers' }, // New tab
  { id: 'hosting', label: 'Hosting' },
];

// VPS Tab Content
{activeTab === 'vps' && (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">VPS Servers</h3>
      <button
        onClick={() => setShowProvisionModal(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Provision New VPS
      </button>
    </div>
    
    {/* VPS List */}
    {vpsServers.map((vps) => (
      <div key={vps.id} className="border rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{vps.hostname || `VPS-${vps.id}`}</h4>
            <p className="text-sm text-gray-600">
              IP: {vps.ip_address} | Provider: {vps.provider}
            </p>
            <p className="text-sm">
              {vps.specs?.cpu} | {vps.specs?.ram} | {vps.specs?.storage}
            </p>
          </div>
          <div>
            <span className={`px-2 py-1 rounded text-sm ${
              vps.status === 'active' ? 'bg-green-100 text-green-800' :
              vps.status === 'provisioning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {vps.status}
            </span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="px-3 py-1 text-sm border rounded">
            View Details
          </button>
          <button className="px-3 py-1 text-sm border rounded">
            Reboot
          </button>
          <button className="px-3 py-1 text-sm border rounded text-red-600">
            Suspend
          </button>
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 💰 Pricing Strategy

### **Recommended Pricing Model:**

1. **Markup on Provider Cost:**
   - DigitalOcean: $24/mo → Sell for $29.99/mo (25% markup)
   - Vultr: $12/mo → Sell for $19.99/mo (67% markup)
   - Hetzner: €4.51/mo → Sell for $9.99/mo (120% markup)

2. **Value-Added Services:**
   - Managed VPS: +$20/mo (updates, monitoring, backups)
   - Premium Support: +$10/mo
   - Backup Service: +$5/mo
   - DDoS Protection: +$15/mo

3. **Bundles:**
   - VPS + Domain: Save 10%
   - VPS + SSL: Save 15%
   - Annual Plans: Save 20%

---

## ✅ Best Practices

### **1. Provider Selection:**
- **DigitalOcean**: Best for beginners, great API, good docs
- **Vultr**: Good pricing, many locations
- **Hetzner**: Best value, European focus
- **AWS/GCP/Azure**: Enterprise customers, complex needs

### **2. Security:**
- ✅ Encrypt credentials in database
- ✅ Use SSH keys instead of passwords
- ✅ Enable firewall by default
- ✅ Regular security updates

### **3. Monitoring:**
- Track provisioning success rate
- Monitor server uptime
- Alert on failed payments
- Auto-suspend on non-payment

### **4. Customer Experience:**
- Send welcome email with credentials
- Provide setup guides
- Offer managed services
- 24/7 support for premium plans

### **5. Automation:**
- Auto-provision on payment
- Auto-suspend on non-payment (after grace period)
- Auto-delete after cancellation period
- Auto-renewal reminders

---

## 🚀 Quick Start Checklist

- [ ] Choose provider (DigitalOcean recommended for start)
- [ ] Create API account and get token
- [ ] Add provider service class
- [ ] Create VPS product in admin panel
- [ ] Set up provisioning endpoint
- [ ] Test provisioning flow
- [ ] Add VPS management UI
- [ ] Set up email notifications
- [ ] Configure auto-provisioning on payment
- [ ] Test end-to-end: Order → Payment → Provision → Email

---

## 📊 Example Product Catalog

### **VPS Plans:**

**VPS Starter** - $29.99/mo
- 2 vCPU
- 4 GB RAM
- 80 GB SSD
- 2 TB Bandwidth
- Automated provisioning

**VPS Business** - $59.99/mo
- 4 vCPU
- 8 GB RAM
- 160 GB SSD
- 4 TB Bandwidth
- Automated provisioning

**VPS Enterprise** - $119.99/mo
- 8 vCPU
- 16 GB RAM
- 320 GB SSD
- 8 TB Bandwidth
- Automated provisioning

### **Dedicated Servers:**

**Dedicated Small** - $199/mo
- 4 CPU Cores
- 32 GB RAM
- 1 TB SSD
- 10 TB Bandwidth
- Manual provisioning (custom config)

**Dedicated Medium** - $399/mo
- 8 CPU Cores
- 64 GB RAM
- 2 TB SSD
- 20 TB Bandwidth
- Manual provisioning

---

## 🎯 Next Steps

1. **Start Small**: Begin with one provider (DigitalOcean)
2. **Test Thoroughly**: Provision test VPS before going live
3. **Monitor Costs**: Track provider costs vs. revenue
4. **Scale Gradually**: Add more providers as you grow
5. **Add Value**: Offer managed services for higher margins

---

## 📞 Support

For implementation help:
- Check provider API documentation
- Test in staging environment first
- Monitor error logs
- Have rollback plan ready

**Good luck with your VPS business! 🚀**

