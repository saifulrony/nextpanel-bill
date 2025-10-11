"""
NextPanel Server Model
Stores information about managed NextPanel servers
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class NextPanelServer(Base):
    """Model for managing multiple NextPanel servers"""
    __tablename__ = "nextpanel_servers"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Server Information
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    base_url = Column(String(255), nullable=False)  # e.g., https://panel1.example.com
    
    # API Credentials
    api_key = Column(String(255), nullable=False)
    api_secret = Column(String(255), nullable=False)  # Should be encrypted in production!
    
    # Server Status
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=True)
    last_checked = Column(DateTime, nullable=True)
    
    # Capacity Management
    capacity = Column(Integer, default=100, nullable=False)  # Max accounts
    current_accounts = Column(Integer, default=0, nullable=False)
    
    # Metadata
    server_ip = Column(String(45), nullable=True)
    location = Column(String(100), nullable=True)  # e.g., "US-East", "EU-West"
    tags = Column(JSON, nullable=True)  # e.g., ["premium", "managed"]
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<NextPanelServer(name='{self.name}', url='{self.base_url}')>"
    
    @property
    def utilization_percent(self) -> float:
        """Calculate server utilization percentage"""
        if self.capacity == 0:
            return 0.0
        return (self.current_accounts / self.capacity) * 100
    
    @property
    def available_slots(self) -> int:
        """Get number of available slots"""
        return max(0, self.capacity - self.current_accounts)
    
    @property
    def is_available(self) -> bool:
        """Check if server can accept new accounts"""
        return self.is_active and self.is_online and self.available_slots > 0


class NextPanelAccount(Base):
    """Model to track accounts provisioned on NextPanel servers"""
    __tablename__ = "nextpanel_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Billing System Reference
    customer_id = Column(Integer, nullable=False, index=True)  # FK to customers table
    order_id = Column(Integer, nullable=True, index=True)  # FK to orders table
    
    # NextPanel Server Reference
    server_id = Column(Integer, nullable=False, index=True)  # FK to nextpanel_servers
    nextpanel_user_id = Column(Integer, nullable=False)  # User ID in NextPanel
    
    # Account Details
    username = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)
    
    # Status
    status = Column(String(20), default="active")  # active, suspended, deleted
    suspension_reason = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    suspended_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    last_synced_at = Column(DateTime, nullable=True)
    
    # Metadata
    meta_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<NextPanelAccount(username='{self.username}', server_id={self.server_id})>"

