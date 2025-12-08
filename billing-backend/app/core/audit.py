"""
Audit logging utilities for staff management actions
"""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import StaffAuditLog, StaffActivityLog
from datetime import datetime
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


async def log_audit_action(
    db: AsyncSession,
    action_type: str,
    performed_by: str,
    target_user_id: Optional[str] = None,
    target_role_id: Optional[str] = None,
    target_permission_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log an audit action (role/permission changes, user edits, etc.)"""
    try:
        audit_log = StaffAuditLog(
            action_type=action_type,
            performed_by=performed_by,
            target_user_id=target_user_id,
            target_role_id=target_role_id,
            target_permission_id=target_permission_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow()
        )
        db.add(audit_log)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log audit action: {e}")
        await db.rollback()


async def log_activity(
    db: AsyncSession,
    user_id: str,
    action_type: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log a staff activity (orders modified, tickets handled, etc.)"""
    try:
        activity_log = StaffActivityLog(
            user_id=user_id,
            action_type=action_type,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            action_metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow()
        )
        db.add(activity_log)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log activity: {e}")
        await db.rollback()


def get_client_ip(request) -> Optional[str]:
    """Extract client IP from request"""
    if hasattr(request, 'client') and request.client:
        return request.client.host
    return None


def get_user_agent(request) -> Optional[str]:
    """Extract user agent from request"""
    if hasattr(request, 'headers'):
        return request.headers.get('user-agent')
    return None

