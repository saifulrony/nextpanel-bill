# 🖥️ How WHMCS Users Sell Dedicated Servers - Complete Guide

## 📋 Overview

This guide explains how **WHMCS** (Web Host Manager Complete Solution) handles dedicated server sales and how you can implement similar functionality in your billing system.

---

## 🎯 How WHMCS Sells Dedicated Servers

### **1. Product Configuration**

WHMCS uses a **product-based approach** with the following structure:

```
Product Type: Server/VPS
├── Product Group (e.g., "Dedicated Servers")
├── Product Name (e.g., "Dedicated Server - Small")
├── Module Settings (Provisioning Module)
├── Pricing (Monthly/Quarterly/Annually)
└── Custom Fields (IP Address, Location, etc.)
```

**Key Features:**
- ✅ Product groups for organization
- ✅ Multiple pricing cycles
- ✅ Custom fields for server details
- ✅ Module-based provisioning
- ✅ Automatic setup on payment

---

### **2. Provisioning Modules**

WHMCS uses **provisioning modules** to automate server management:

#### **A. Built-in Modules:**
- **Generic Server Module** - Manual provisioning with SSH/API
- **cPanel/WHM Module** - For managed dedicated servers
- **Plesk Module** - For Plesk-managed servers

#### **B. Third-Party Modules:**
- **EasyDCIM** - Data center infrastructure management
- **OpenStack** - Cloud infrastructure
- **OVHcloud** - OVH dedicated servers
- **Hetzner** - Hetzner dedicated servers
- **Limestone Networks** - Reseller dedicated servers

**How Modules Work:**
```php
// WHMCS Module Structure
function dedicatedserver_CreateAccount($params) {
    // 1. Connect to server provider API
    // 2. Provision server
    // 3. Get IP address and credentials
    // 4. Send welcome email
    return "success";
}

function dedicatedserver_SuspendAccount($params) {
    // Suspend server
}

function dedicatedserver_TerminateAccount($params) {
    // Delete server
}
```

---

### **3. Workflow: Order → Payment → Provisioning**

```
1. Customer Orders Dedicated Server
   ↓
2. Order Created (Status: Pending)
   ↓
3. Customer Pays Invoice
   ↓
4. Order Status → Active
   ↓
5. WHMCS Calls Module: CreateAccount()
   ↓
6. Module Provisions Server via API
   ↓
7. Server Details Saved to Database
   ↓
8. Welcome Email Sent to Customer
   ↓
9. Customer Receives:
   - IP Address
   - Root Password
   - SSH Access Details
   - Control Panel URL (if applicable)
```

---

### **4. Server Management Features**

WHMCS provides:

**A. Server Inventory Management:**
- Track available servers
- Assign servers to orders
- Monitor server status
- Capacity management

**B. Automation:**
- Auto-provision on payment
- Auto-suspend on non-payment
- Auto-terminate on cancellation
- Auto-renewal reminders

**C. Customer Portal:**
- View server details
- Reboot server
- Reinstall OS
- View bandwidth usage
- Access control panel

---

## 🚀 How to Implement Similar Functionality

### **Step 1: Create Dedicated Server Product Model**

```python
# billing-backend/app/models/dedicated_server.py
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class DedicatedServerProduct(Base):
    """Product definition for dedicated servers"""
    __tablename__ = "dedicated_server_products"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Server Specifications
    cpu_cores = Column(Integer, nullable=False)
    cpu_model = Column(String(100), nullable=True)
    ram_gb = Column(Integer, nullable=False)
    storage_gb = Column(Integer, nullable=False)
    storage_type = Column(String(50), nullable=True)  # SSD, HDD, NVMe
    bandwidth_tb = Column(Integer, nullable=False)
    ip_addresses = Column(Integer, default=1)
    
    # Location
    datacenter_location = Column(String(100), nullable=True)
    region = Column(String(50), nullable=True)
    
    # Pricing
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_quarterly = Column(Numeric(10, 2), nullable=True)
    price_yearly = Column(Numeric(10, 2), nullable=True)
    setup_fee = Column(Numeric(10, 2), default=0)
    
    # Provisioning
    provisioning_module = Column(String(50), nullable=True)  # manual, api, ssh
    provider = Column(String(50), nullable=True)  # ovh, hetzner, custom
    module_config = Column(JSON, nullable=True)  # Module-specific config
    
    # Availability
    is_active = Column(Boolean, default=True)
    stock_count = Column(Integer, nullable=True)  # null = unlimited
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class DedicatedServerInstance(Base):
    """Actual provisioned server instance"""
    __tablename__ = "dedicated_server_instances"
    
    id = Column(Integer, primary_key=True)
    customer_id = Column(String(255), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("dedicated_server_products.id"))
    
    # Server Details
    hostname = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=False)
    ip_addresses = Column(JSON, nullable=True)  # Array of IPs
    mac_address = Column(String(17), nullable=True)
    
    # Hardware Specs (from product)
    cpu_cores = Column(Integer, nullable=False)
    ram_gb = Column(Integer, nullable=False)
    storage_gb = Column(Integer, nullable=False)
    
    # Credentials (encrypted in production!)
    root_password = Column(String(255), nullable=True)
    ssh_key = Column(Text, nullable=True)
    
    # Status
    status = Column(String(20), default="provisioning")  # provisioning, active, suspended, cancelled
    provisioned_at = Column(DateTime, nullable=True)
    suspended_at = Column(DateTime, nullable=True)
    
    # Provider Info
    provider = Column(String(50), nullable=True)
    provider_server_id = Column(String(100), nullable=True)
    provider_api_response = Column(JSON, nullable=True)
    
    # Control Panel
    control_panel_url = Column(String(255), nullable=True)
    control_panel_type = Column(String(50), nullable=True)  # cpanel, plesk, custom
    
    # Metadata
    meta_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
```

---

### **Step 2: Create Provisioning Module Interface**

```python
# billing-backend/app/services/provisioning/base.py
from abc import ABC, abstractmethod
from typing import Dict, Optional

class ProvisioningModule(ABC):
    """Base class for all provisioning modules"""
    
    @abstractmethod
    def create_account(self, params: Dict) -> Dict:
        """
        Provision a new dedicated server
        
        Returns:
            {
                "success": True/False,
                "server_id": "...",
                "ip_address": "...",
                "root_password": "...",
                "error": "..." (if failed)
            }
        """
        pass
    
    @abstractmethod
    def suspend_account(self, server_id: str) -> Dict:
        """Suspend server"""
        pass
    
    @abstractmethod
    def unsuspend_account(self, server_id: str) -> Dict:
        """Unsuspend server"""
        pass
    
    @abstractmethod
    def terminate_account(self, server_id: str) -> Dict:
        """Delete server"""
        pass
    
    @abstractmethod
    def get_server_status(self, server_id: str) -> Dict:
        """Get server status and details"""
        pass
    
    @abstractmethod
    def reboot_server(self, server_id: str) -> Dict:
        """Reboot server"""
        pass
```

---

### **Step 3: Implement Specific Modules**

#### **A. Manual Provisioning Module**

```python
# billing-backend/app/services/provisioning/manual.py
from .base import ProvisioningModule
import logging

logger = logging.getLogger(__name__)

class ManualProvisioningModule(ProvisioningModule):
    """
    Manual provisioning - admin provisions server manually
    Then updates the record via API or admin panel
    """
    
    def create_account(self, params: Dict) -> Dict:
        """
        For manual provisioning, we:
        1. Create server record with status 'pending_provisioning'
        2. Send notification to admin
        3. Admin provisions server manually
        4. Admin updates record with IP/credentials
        """
        logger.info(f"Manual provisioning requested for order {params.get('order_id')}")
        
        # Create server record in pending state
        return {
            "success": True,
            "status": "pending_provisioning",
            "message": "Server pending manual provisioning by admin",
            "requires_manual_setup": True
        }
    
    def suspend_account(self, server_id: str) -> Dict:
        # Manual suspend - notify admin
        return {"success": True, "message": "Admin will suspend server manually"}
    
    def unsuspend_account(self, server_id: str) -> Dict:
        return {"success": True, "message": "Admin will unsuspend server manually"}
    
    def terminate_account(self, server_id: str) -> Dict:
        return {"success": True, "message": "Admin will terminate server manually"}
    
    def get_server_status(self, server_id: str) -> Dict:
        # Return current status from database
        return {"success": True, "status": "active"}
    
    def reboot_server(self, server_id: str) -> Dict:
        return {"success": True, "message": "Admin will reboot server manually"}
```

#### **B. OVH Dedicated Server Module**

```python
# billing-backend/app/services/provisioning/ovh.py
from .base import ProvisioningModule
import ovh
import os

class OVHProvisioningModule(ProvisioningModule):
    """OVH Dedicated Server provisioning"""
    
    def __init__(self):
        self.client = ovh.Client(
            endpoint=os.getenv('OVH_ENDPOINT', 'ovh-eu'),
            application_key=os.getenv('OVH_APPLICATION_KEY'),
            application_secret=os.getenv('OVH_APPLICATION_SECRET'),
            consumer_key=os.getenv('OVH_CONSUMER_KEY')
        )
    
    def create_account(self, params: Dict) -> Dict:
        """Order and provision OVH dedicated server"""
        try:
            # Map product to OVH server model
            server_model = self._map_product_to_ovh_model(params['product_specs'])
            
            # Order server
            order = self.client.post('/dedicated/server', **{
                'name': params['hostname'],
                'datacenter': params.get('datacenter', 'GRA1'),
                'model': server_model,
                'install': True,
                'os': params.get('os', 'ubuntu-22.04')
            })
            
            # Wait for provisioning (OVH provides server ID immediately)
            server_id = order['serverId']
            
            # Get server details
            server_info = self.client.get(f'/dedicated/server/{server_id}')
            
            return {
                "success": True,
                "server_id": server_id,
                "ip_address": server_info['ip'],
                "status": "provisioning",
                "provider_order_id": order['orderId']
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _map_product_to_ovh_model(self, specs: Dict) -> str:
        """Map your product specs to OVH server model"""
        # Example mapping
        if specs['cpu_cores'] == 4 and specs['ram_gb'] == 32:
            return "SP-32"
        elif specs['cpu_cores'] == 8 and specs['ram_gb'] == 64:
            return "SP-64"
        # Add more mappings
        return "SP-32"  # Default
    
    def suspend_account(self, server_id: str) -> Dict:
        # OVH doesn't support suspend, use power off
        try:
            self.client.post(f'/dedicated/server/{server_id}/reboot', bootId=112233)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def unsuspend_account(self, server_id: str) -> Dict:
        try:
            self.client.post(f'/dedicated/server/{server_id}/reboot', bootId=1)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def terminate_account(self, server_id: str) -> Dict:
        # Cancel server (may require termination request)
        try:
            self.client.delete(f'/dedicated/server/{server_id}')
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_server_status(self, server_id: str) -> Dict:
        try:
            server = self.client.get(f'/dedicated/server/{server_id}')
            return {
                "success": True,
                "status": server['state'],
                "ip_address": server['ip'],
                "datacenter": server['datacenter']
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def reboot_server(self, server_id: str) -> Dict:
        try:
            self.client.post(f'/dedicated/server/{server_id}/reboot', bootId=1)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
```

#### **C. Hetzner Dedicated Server Module**

```python
# billing-backend/app/services/provisioning/hetzner.py
from .base import ProvisioningModule
import requests

class HetznerProvisioningModule(ProvisioningModule):
    """Hetzner Dedicated Server provisioning"""
    
    def __init__(self):
        self.api_token = os.getenv('HETZNER_API_TOKEN')
        self.base_url = "https://api.hetzner.cloud/v1"
    
    def create_account(self, params: Dict) -> Dict:
        """Order Hetzner dedicated server"""
        # Note: Hetzner Cloud API is for VPS, dedicated servers require different API
        # This is a simplified example
        try:
            url = f"{self.base_url}/servers"
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }
            data = {
                "name": params['hostname'],
                "server_type": self._map_product_to_hetzner_type(params['product_specs']),
                "image": params.get('os', 'ubuntu-22.04'),
                "location": params.get('location', 'nbg1')
            }
            
            response = requests.post(url, json=data, headers=headers)
            response.raise_for_status()
            server = response.json()['server']
            
            return {
                "success": True,
                "server_id": str(server['id']),
                "ip_address": server['public_net']['ipv4']['ip'],
                "status": server['status']
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _map_product_to_hetzner_type(self, specs: Dict) -> str:
        """Map product specs to Hetzner server type"""
        # Example mapping
        if specs['cpu_cores'] == 2 and specs['ram_gb'] == 4:
            return "cx21"
        elif specs['cpu_cores'] == 4 and specs['ram_gb'] == 8:
            return "cx41"
        return "cx21"
    
    # Implement other methods...
```

---

### **Step 4: Create Provisioning API Endpoint**

```python
# billing-backend/app/api/v1/dedicated_servers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.provisioning.factory import ProvisioningModuleFactory

router = APIRouter(prefix="/dedicated-servers", tags=["Dedicated Servers"])

@router.post("/provision")
async def provision_dedicated_server(
    order_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Provision dedicated server when order is paid
    Similar to WHMCS module CreateAccount()
    """
    # Get order
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    
    # Get product
    product = await db.get(DedicatedServerProduct, order.items[0]['product_id'])
    
    # Get provisioning module
    module = ProvisioningModuleFactory.get_module(
        product.provisioning_module,
        product.module_config
    )
    
    # Provision server
    result = module.create_account({
        "order_id": order_id,
        "customer_id": order.customer_id,
        "product_specs": {
            "cpu_cores": product.cpu_cores,
            "ram_gb": product.ram_gb,
            "storage_gb": product.storage_gb
        },
        "hostname": f"server-{order.customer_id}-{order_id}",
        "os": order.items[0].get('os', 'ubuntu-22.04'),
        "datacenter": order.items[0].get('datacenter', 'default')
    })
    
    if not result['success']:
        raise HTTPException(500, f"Provisioning failed: {result.get('error')}")
    
    # Save server instance
    server = DedicatedServerInstance(
        customer_id=order.customer_id,
        order_id=order_id,
        product_id=product.id,
        ip_address=result['ip_address'],
        provider=product.provider,
        provider_server_id=result['server_id'],
        status=result.get('status', 'provisioning'),
        cpu_cores=product.cpu_cores,
        ram_gb=product.ram_gb,
        storage_gb=product.storage_gb,
        root_password=result.get('root_password'),
        meta_data=result
    )
    db.add(server)
    await db.commit()
    
    # Send welcome email
    await send_server_welcome_email(order.customer_id, server)
    
    return {
        "success": True,
        "server_id": server.id,
        "ip_address": server.ip_address
    }
```

---

### **Step 5: Server Management Endpoints**

```python
@router.post("/{server_id}/reboot")
async def reboot_server(server_id: int, db: AsyncSession = Depends(get_db)):
    """Reboot dedicated server"""
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(404, "Server not found")
    
    module = ProvisioningModuleFactory.get_module(
        server.product.provisioning_module,
        server.product.module_config
    )
    
    result = module.reboot_server(server.provider_server_id)
    return result

@router.post("/{server_id}/suspend")
async def suspend_server(server_id: int, db: AsyncSession = Depends(get_db)):
    """Suspend dedicated server"""
    server = await db.get(DedicatedServerInstance, server_id)
    module = ProvisioningModuleFactory.get_module(...)
    result = module.suspend_account(server.provider_server_id)
    
    server.status = "suspended"
    server.suspended_at = datetime.utcnow()
    await db.commit()
    
    return result

@router.get("/{server_id}/status")
async def get_server_status(server_id: int, db: AsyncSession = Depends(get_db)):
    """Get server status"""
    server = await db.get(DedicatedServerInstance, server_id)
    module = ProvisioningModuleFactory.get_module(...)
    return module.get_server_status(server.provider_server_id)
```

---

## 📊 Comparison: WHMCS vs Your System

| Feature | WHMCS | Your System (Implementation) |
|---------|-------|------------------------------|
| **Product Types** | Server/VPS product type | DedicatedServerProduct model |
| **Provisioning** | Module-based | ProvisioningModule interface |
| **Auto-Provision** | On payment | Via order webhook |
| **Server Management** | Built-in | Custom API endpoints |
| **Customer Portal** | Built-in | Custom frontend |
| **Inventory** | Server groups | Stock management in product |
| **Billing** | Integrated | Order system integration |

---

## ✅ Best Practices from WHMCS

1. **Module-Based Architecture**
   - ✅ Separate provisioning logic from core system
   - ✅ Easy to add new providers
   - ✅ Consistent interface

2. **Status Management**
   - ✅ Track: provisioning → active → suspended → cancelled
   - ✅ Timestamps for each status change
   - ✅ Audit trail

3. **Error Handling**
   - ✅ Graceful failures
   - ✅ Retry mechanisms
   - ✅ Admin notifications

4. **Customer Experience**
   - ✅ Welcome emails with credentials
   - ✅ Self-service portal
   - ✅ Clear status updates

---

## 🚀 Quick Start Checklist

- [ ] Create DedicatedServerProduct model
- [ ] Create DedicatedServerInstance model
- [ ] Implement ProvisioningModule interface
- [ ] Create ManualProvisioningModule
- [ ] Create API provider module (OVH/Hetzner/etc.)
- [ ] Add provisioning endpoint
- [ ] Add server management endpoints
- [ ] Create admin UI for server management
- [ ] Create customer portal for server control
- [ ] Set up auto-provisioning on payment
- [ ] Test end-to-end workflow

---

## 📚 Additional Resources

- **WHMCS Documentation**: https://docs.whmcs.com/
- **WHMCS Module Development**: https://developers.whmcs.com/provisioning-modules/
- **OVH API**: https://api.ovh.com/
- **Hetzner API**: https://docs.hetzner.cloud/

---

**This implementation gives you WHMCS-like functionality for dedicated servers!** 🎉

