"""
Page Schemas for Page Builder
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class ComponentSchema(BaseModel):
    id: str
    type: str
    content: Optional[str] = None
    props: Dict[str, Any] = Field(default_factory=dict)
    children: Optional[List['ComponentSchema']] = None
    style: Optional[Dict[str, Any]] = Field(default_factory=dict)
    className: Optional[str] = None


class PageBase(BaseModel):
    slug: str
    title: str
    description: Optional[str] = None
    components: List[ComponentSchema] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    is_active: str = "active"
    is_homepage: bool = False


class PageCreate(PageBase):
    pass


class PageUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    components: Optional[List[ComponentSchema]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[str] = None
    is_homepage: Optional[bool] = None


class PageResponse(PageBase):
    id: str  # Changed from UUID to str for SQLite compatibility
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        """Custom from_orm to parse JSON strings from SQLite"""
        import json
        data = {
            'id': obj.id,
            'slug': obj.slug,
            'title': obj.title,
            'description': obj.description,
            'components': json.loads(obj.components) if isinstance(obj.components, str) else obj.components,
            'metadata': json.loads(obj.page_metadata) if isinstance(obj.page_metadata, str) else obj.page_metadata,
            'is_active': obj.is_active,
            'is_homepage': obj.is_homepage or False,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at,
        }
        return cls(**data)

