"""
Email Notification API endpoints (for manual triggers and preferences)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import User
from app.services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("/send-test-email")
async def send_test_email(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Send a test email to verify email configuration"""
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email_service = EmailService()
    
    success = await email_service.send_email(
        to_email=user.email,
        subject="Test Email from NextPanel Billing",
        body="This is a test email to verify your email configuration is working correctly.",
        html_body="<html><body><h2>Test Email</h2><p>This is a test email to verify your email configuration is working correctly.</p></body></html>"
    )
    
    return {
        "status": "success" if success else "failed",
        "email": user.email,
        "message": "Test email sent successfully" if success else "Failed to send test email"
    }


@router.post("/resend-welcome-email")
async def resend_welcome_email(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Resend welcome email"""
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    email_service = EmailService()
    success = await email_service.send_welcome_email(
        user_email=user.email,
        user_name=user.full_name or user.email
    )
    
    return {
        "status": "success" if success else "failed",
        "message": "Welcome email sent" if success else "Failed to send welcome email"
    }


@router.get("/preferences")
async def get_notification_preferences(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's notification preferences"""
    # TODO: Implement notification preferences storage
    # For now, return default preferences
    
    return {
        "email_notifications": True,
        "payment_receipts": True,
        "license_expiry_reminders": True,
        "domain_expiry_reminders": True,
        "quota_alerts": True,
        "marketing_emails": False
    }


@router.put("/preferences")
async def update_notification_preferences(
    preferences: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update user's notification preferences"""
    # TODO: Implement notification preferences storage
    # For now, just return success
    
    logger.info(f"User {user_id} updated notification preferences: {preferences}")
    
    return {
        "status": "success",
        "message": "Notification preferences updated",
        "preferences": preferences
    }

