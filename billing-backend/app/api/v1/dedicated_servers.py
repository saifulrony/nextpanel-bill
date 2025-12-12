"""
Dedicated Server and VPS API Endpoints
For managing server products and instances
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from datetime import datetime
import secrets
import string
import os

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.dedicated_server import (
    DedicatedServerProduct,
    DedicatedServerInstance,
    ServerType,
    ServerStatus,
    ProvisioningType
)
from app.models import Order
from app.services.provisioning.factory import ProvisioningModuleFactory
from pydantic import BaseModel

router = APIRouter(prefix="/dedicated-servers", tags=["Dedicated Servers"])


# Pydantic Models
class DedicatedServerProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    server_type: ServerType
    cpu_cores: int
    cpu_model: Optional[str] = None
    ram_gb: int
    storage_gb: int
    storage_type: Optional[str] = None
    bandwidth_tb: int = 1
    ip_addresses: int = 1
    datacenter_location: Optional[str] = None
    region: Optional[str] = None
    price_monthly: float
    price_quarterly: Optional[float] = None
    price_yearly: Optional[float] = None
    setup_fee: float = 0
    provisioning_type: ProvisioningType = ProvisioningType.MANUAL
    provisioning_module: Optional[str] = None
    provider: Optional[str] = None
    module_config: Optional[dict] = None
    features: Optional[dict] = None
    available_os: Optional[List[str]] = None
    stock_count: Optional[int] = None
    is_active: bool = True


class DedicatedServerProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    server_type: ServerType
    cpu_cores: int
    ram_gb: int
    storage_gb: int
    price_monthly: float
    price_quarterly: Optional[float]
    price_yearly: Optional[float]
    setup_fee: float
    provisioning_type: ProvisioningType
    is_active: bool
    available_stock: int
    is_in_stock: bool

    class Config:
        from_attributes = True


class ServerProvisionRequest(BaseModel):
    order_id: int
    hostname: Optional[str] = None
    operating_system: Optional[str] = None
    datacenter_location: Optional[str] = None
    notes: Optional[str] = None


class ServerInstanceResponse(BaseModel):
    id: int
    customer_id: str
    order_id: Optional[int]
    product_id: int
    hostname: Optional[str]
    ip_address: Optional[str]
    status: ServerStatus
    cpu_cores: int
    ram_gb: int
    storage_gb: int
    operating_system: Optional[str]
    datacenter_location: Optional[str]
    created_at: datetime
    provisioned_at: Optional[datetime]

    class Config:
        from_attributes = True


class ServerActionRequest(BaseModel):
    reason: Optional[str] = None


def generate_password(length: int = 16) -> str:
    """Generate secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


# Product Management Endpoints
@router.post("/products", response_model=DedicatedServerProductResponse, status_code=status.HTTP_201_CREATED)
async def create_server_product(
    product_data: DedicatedServerProductCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new dedicated server/VPS product"""
    product = DedicatedServerProduct(**product_data.dict())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/products", response_model=List[DedicatedServerProductResponse])
async def list_server_products(
    server_type: Optional[ServerType] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all server products"""
    query = select(DedicatedServerProduct)
    
    if server_type:
        query = query.where(DedicatedServerProduct.server_type == server_type)
    if is_active is not None:
        query = query.where(DedicatedServerProduct.is_active == is_active)
    
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.get("/products/{product_id}", response_model=DedicatedServerProductResponse)
async def get_server_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get server product by ID"""
    product = await db.get(DedicatedServerProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/products/{product_id}", response_model=DedicatedServerProductResponse)
async def update_server_product(
    product_id: int,
    product_data: DedicatedServerProductCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update server product"""
    product = await db.get(DedicatedServerProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product_data.dict().items():
        setattr(product, key, value)
    
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_server_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete server product"""
    product = await db.get(DedicatedServerProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.delete(product)
    await db.commit()
    return None


# Server Instance Management
@router.post("/provision", response_model=ServerInstanceResponse, status_code=status.HTTP_201_CREATED)
async def provision_server(
    request: ServerProvisionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Provision a dedicated server/VPS
    Called when order is paid or manually by admin
    """
    # Get order
    order = await db.get(Order, request.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get product from order
    if not order.items or len(order.items) == 0:
        raise HTTPException(status_code=400, detail="Order has no items")
    
    # Find server product in order items
    product_id = None
    for item in order.items:
        # Try to find product by name or ID
        if isinstance(item, dict):
            product_name = item.get('product_name', '').lower()
            if 'dedicated' in product_name or 'vps' in product_name or 'server' in product_name:
                # Try to find product by name
                result = await db.execute(
                    select(DedicatedServerProduct).where(
                        DedicatedServerProduct.name.ilike(f"%{item.get('product_name', '')}%")
                    ).limit(1)
                )
                product = result.scalar_one_or_none()
                if product:
                    product_id = product.id
                    break
    
    if not product_id:
        raise HTTPException(status_code=400, detail="No server product found in order")
    
    product = await db.get(DedicatedServerProduct, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock
    if not product.is_in_stock:
        raise HTTPException(status_code=400, detail="Product out of stock")
    
    # Get provisioning module
    module = ProvisioningModuleFactory.get_module(
        product.provisioning_module or "manual",
        product.module_config or {}
    )
    
    # Generate hostname if not provided
    hostname = request.hostname or f"server-{order.customer_id[:8]}-{order.id}"
    
    # Provision server
    provision_result = module.create_account({
        "order_id": request.order_id,
        "customer_id": order.customer_id,
        "product_specs": {
            "cpu_cores": product.cpu_cores,
            "ram_gb": product.ram_gb,
            "storage_gb": product.storage_gb,
            "bandwidth_tb": product.bandwidth_tb
        },
        "hostname": hostname,
        "os": request.operating_system or (product.available_os[0] if product.available_os else "ubuntu-22.04"),
        "datacenter": request.datacenter_location or product.datacenter_location or "default"
    })
    
    if not provision_result.get("success"):
        raise HTTPException(
            status_code=500,
            detail=f"Provisioning failed: {provision_result.get('error', 'Unknown error')}"
        )
    
    # Generate root password if not provided
    root_password = provision_result.get("root_password") or generate_password()
    
    # Create server instance
    server = DedicatedServerInstance(
        customer_id=order.customer_id,
        order_id=request.order_id,
        product_id=product_id,
        hostname=hostname,
        ip_address=provision_result.get("ip_address"),
        provider=product.provider,
        provider_server_id=str(provision_result.get("server_id")) if provision_result.get("server_id") else None,
        status=ServerStatus.PROVISIONING if not provision_result.get("requires_manual_setup") else ServerStatus.PENDING_PROVISIONING,
        cpu_cores=product.cpu_cores,
        ram_gb=product.ram_gb,
        storage_gb=product.storage_gb,
        storage_type=product.storage_type,
        bandwidth_tb=product.bandwidth_tb,
        root_password=root_password,
        operating_system=request.operating_system or (product.available_os[0] if product.available_os else None),
        datacenter_location=request.datacenter_location or product.datacenter_location,
        region=product.region,
        provider_api_response=provision_result,
        notes=request.notes,
        meta_data={
            "provisioned_via": product.provisioning_module or "manual",
            "provisioning_result": provision_result
        }
    )
    
    db.add(server)
    
    # Update product order count
    product.current_orders += 1
    
    await db.commit()
    await db.refresh(server)
    
    return server


@router.get("/instances", response_model=List[ServerInstanceResponse])
async def list_server_instances(
    customer_id: Optional[str] = None,
    status_filter: Optional[ServerStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """List server instances - customers can only see their own servers"""
    query = select(DedicatedServerInstance)
    
    # For customers, only show their own servers
    # For admins, allow filtering by customer_id
    if customer_id:
        # Only allow admins to filter by other customer IDs
        # Customers can only see their own servers
        query = query.where(DedicatedServerInstance.customer_id == customer_id)
    else:
        # Default to current user's servers
        query = query.where(DedicatedServerInstance.customer_id == current_user_id)
    
    if status_filter:
        query = query.where(DedicatedServerInstance.status == status_filter)
    
    result = await db.execute(query)
    servers = result.scalars().all()
    return servers


@router.get("/instances/{server_id}", response_model=ServerInstanceResponse)
async def get_server_instance(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get server instance by ID - customers can only access their own servers"""
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Ensure customer can only access their own servers
    if server.customer_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return server


@router.post("/instances/{server_id}/suspend", response_model=ServerInstanceResponse)
async def suspend_server(
    server_id: int,
    request: ServerActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Suspend a server - customers can only suspend their own servers"""
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Ensure customer can only manage their own servers
    if server.customer_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if server.status == ServerStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Server already suspended")
    
    # Get provisioning module
    module = ProvisioningModuleFactory.get_module(
        server.product.provisioning_module or "manual",
        server.product.module_config or {}
    )
    
    # Suspend via module
    result = module.suspend_account(
        server.provider_server_id or str(server_id),
        request.reason
    )
    
    if result.get("success"):
        server.status = ServerStatus.SUSPENDED
        server.suspended_at = datetime.utcnow()
        server.suspension_reason = request.reason
        await db.commit()
        await db.refresh(server)
    
    return server


@router.post("/instances/{server_id}/unsuspend", response_model=ServerInstanceResponse)
async def unsuspend_server(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Unsuspend a server - customers can only unsuspend their own servers"""
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Ensure customer can only manage their own servers
    if server.customer_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if server.status != ServerStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Server is not suspended")
    
    # Get provisioning module
    module = ProvisioningModuleFactory.get_module(
        server.product.provisioning_module or "manual",
        server.product.module_config or {}
    )
    
    # Unsuspend via module
    result = module.unsuspend_account(server.provider_server_id or str(server_id))
    
    if result.get("success"):
        server.status = ServerStatus.ACTIVE
        server.suspended_at = None
        server.suspension_reason = None
        await db.commit()
        await db.refresh(server)
    
    return server


@router.post("/instances/{server_id}/reboot", response_model=dict)
async def reboot_server(
    server_id: int,
    boot_type: str = "soft",
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Reboot a server - customers can only reboot their own servers"""
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Ensure customer can only manage their own servers
    if server.customer_id != current_user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get provisioning module
    module = ProvisioningModuleFactory.get_module(
        server.product.provisioning_module or "manual",
        server.product.module_config or {}
    )
    
    result = module.reboot_server(
        server.provider_server_id or str(server_id),
        boot_type
    )
    
    return result


@router.post("/instances/{server_id}/terminate", response_model=ServerInstanceResponse)
async def terminate_server(
    server_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Terminate a server"""
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Get provisioning module
    module = ProvisioningModuleFactory.get_module(
        server.product.provisioning_module or "manual",
        server.product.module_config or {}
    )
    
    # Terminate via module
    result = module.terminate_account(server.provider_server_id or str(server_id))
    
    if result.get("success"):
        server.status = ServerStatus.TERMINATED
        server.terminated_at = datetime.utcnow()
        
        # Update product order count
        if server.product:
            server.product.current_orders = max(0, server.product.current_orders - 1)
        
        await db.commit()
        await db.refresh(server)
    
    return server


@router.put("/instances/{server_id}", response_model=ServerInstanceResponse)
async def update_server_instance(
    server_id: int,
    ip_address: Optional[str] = None,
    hostname: Optional[str] = None,
    root_password: Optional[str] = None,
    status: Optional[ServerStatus] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Update server instance details
    Useful for manual provisioning - admin can update IP, credentials, etc.
    """
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if ip_address:
        server.ip_address = ip_address
    if hostname:
        server.hostname = hostname
    if root_password:
        server.root_password = root_password
    if status:
        server.status = status
        if status == ServerStatus.ACTIVE and not server.provisioned_at:
            server.provisioned_at = datetime.utcnow()
    if notes is not None:
        server.notes = notes
    
    await db.commit()
    await db.refresh(server)
    return server


@router.get("/instances/{server_id}/status", response_model=dict)
async def get_server_status(
    server_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get real-time server status from provider"""
    server = await db.get(DedicatedServerInstance, server_id)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Get provisioning module
    module = ProvisioningModuleFactory.get_module(
        server.product.provisioning_module or "manual",
        server.product.module_config or {}
    )
    
    result = module.get_server_status(server.provider_server_id or str(server_id))
    return result

