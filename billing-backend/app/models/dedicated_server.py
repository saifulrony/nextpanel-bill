"""
Dedicated Server and VPS Models
For selling and managing dedicated servers and VPS instances
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ServerType(str, enum.Enum):
    """Server type enumeration"""
    DEDICATED = "dedicated"
    VPS = "vps"


class ServerStatus(str, enum.Enum):
    """Server instance status"""
    PROVISIONING = "provisioning"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    TERMINATED = "terminated"
    PENDING_PROVISIONING = "pending_provisioning"


class ProvisioningType(str, enum.Enum):
    """Provisioning method"""
    MANUAL = "manual"
    AUTOMATED = "automated"
    API = "api"


class DedicatedServerProduct(Base):
    """Product definition for dedicated servers and VPS"""
    __tablename__ = "dedicated_server_products"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Information
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    server_type = Column(Enum(ServerType), nullable=False, default=ServerType.VPS)
    
    # Server Specifications
    cpu_cores = Column(Integer, nullable=False)
    cpu_model = Column(String(100), nullable=True)
    ram_gb = Column(Integer, nullable=False)
    storage_gb = Column(Integer, nullable=False)
    storage_type = Column(String(50), nullable=True)  # SSD, HDD, NVMe
    bandwidth_tb = Column(Integer, nullable=False, default=1)
    ip_addresses = Column(Integer, default=1)
    
    # Location
    datacenter_location = Column(String(100), nullable=True)
    region = Column(String(50), nullable=True)
    available_locations = Column(JSON, nullable=True)  # Array of available locations
    
    # Pricing
    price_monthly = Column(Numeric(10, 2), nullable=False)
    price_quarterly = Column(Numeric(10, 2), nullable=True)
    price_yearly = Column(Numeric(10, 2), nullable=True)
    setup_fee = Column(Numeric(10, 2), default=0)
    
    # Provisioning Configuration
    provisioning_type = Column(Enum(ProvisioningType), default=ProvisioningType.MANUAL)
    provisioning_module = Column(String(50), nullable=True)  # manual, ovh, hetzner, digitalocean
    provider = Column(String(50), nullable=True)  # ovh, hetzner, digitalocean, custom
    module_config = Column(JSON, nullable=True)  # Module-specific configuration
    
    # Product Features
    features = Column(JSON, nullable=True)  # Additional features (backups, monitoring, etc.)
    available_os = Column(JSON, nullable=True)  # List of available OS options
    
    # Availability
    is_active = Column(Boolean, default=True)
    stock_count = Column(Integer, nullable=True)  # null = unlimited
    current_orders = Column(Integer, default=0)
    
    # Metadata
    meta_data = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    instances = relationship("DedicatedServerInstance", back_populates="product")
    
    def __repr__(self):
        return f"<DedicatedServerProduct(name='{self.name}', type='{self.server_type}')>"
    
    @property
    def available_stock(self) -> int:
        """Calculate available stock"""
        if self.stock_count is None:
            return -1  # Unlimited
        return max(0, self.stock_count - self.current_orders)
    
    @property
    def is_in_stock(self) -> bool:
        """Check if product is in stock"""
        if self.stock_count is None:
            return True  # Unlimited stock
        return self.current_orders < self.stock_count


class DedicatedServerInstance(Base):
    """Actual provisioned server instance"""
    __tablename__ = "dedicated_server_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # References
    customer_id = Column(String(255), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("dedicated_server_products.id"), nullable=False)
    
    # Server Details
    hostname = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    ip_addresses = Column(JSON, nullable=True)  # Array of IP addresses
    mac_address = Column(String(17), nullable=True)
    
    # Hardware Specs (snapshot from product at time of order)
    cpu_cores = Column(Integer, nullable=False)
    ram_gb = Column(Integer, nullable=False)
    storage_gb = Column(Integer, nullable=False)
    storage_type = Column(String(50), nullable=True)
    bandwidth_tb = Column(Integer, nullable=False)
    
    # Credentials (should be encrypted in production!)
    root_password = Column(String(255), nullable=True)
    ssh_key = Column(Text, nullable=True)
    ssh_port = Column(Integer, default=22)
    
    # Status
    status = Column(Enum(ServerStatus), default=ServerStatus.PENDING_PROVISIONING)
    suspension_reason = Column(Text, nullable=True)
    
    # Timestamps
    provisioned_at = Column(DateTime, nullable=True)
    suspended_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    terminated_at = Column(DateTime, nullable=True)
    
    # Provider Information
    provider = Column(String(50), nullable=True)
    provider_server_id = Column(String(100), nullable=True)
    provider_api_response = Column(JSON, nullable=True)
    
    # Control Panel
    control_panel_url = Column(String(255), nullable=True)
    control_panel_type = Column(String(50), nullable=True)  # cpanel, plesk, custom
    control_panel_username = Column(String(100), nullable=True)
    control_panel_password = Column(String(255), nullable=True)
    
    # Operating System
    operating_system = Column(String(100), nullable=True)  # ubuntu-22.04, centos-7, etc.
    os_version = Column(String(50), nullable=True)
    
    # Location
    datacenter_location = Column(String(100), nullable=True)
    region = Column(String(50), nullable=True)
    
    # Metadata
    meta_data = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)  # Admin notes
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    product = relationship("DedicatedServerProduct", back_populates="instances")
    
    def __repr__(self):
        return f"<DedicatedServerInstance(id={self.id}, hostname='{self.hostname}', status='{self.status}')>"

