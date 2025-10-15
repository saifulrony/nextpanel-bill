"""
Page Model for Page Builder
Stores dynamic page content and layouts
"""
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class Page(Base):
    __tablename__ = "pages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(255), unique=True, nullable=False, index=True)  # e.g., "home", "cart", "checkout"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    components = Column(Text, nullable=False, default='[]')  # Page builder components (JSON string for SQLite)
    page_metadata = Column(Text, nullable=True, default='{}')  # Additional metadata (JSON string for SQLite) - renamed from 'metadata' (reserved)
    is_active = Column(String(20), default="active")  # active, draft, archived
    is_homepage = Column(Boolean, default=False)  # Flag to mark this page as the homepage
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Page(id={self.id}, slug={self.slug}, title={self.title})>"

