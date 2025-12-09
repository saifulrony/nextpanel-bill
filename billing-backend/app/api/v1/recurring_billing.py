"""
Recurring Billing Automation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_admin
from app.services.recurring_billing_service import RecurringBillingService
from app.services.dunning_service import DunningService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recurring-billing", tags=["recurring-billing"])


@router.post("/process-renewals")
async def process_renewals(
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger renewal processing (admin only)"""
    service = RecurringBillingService()
    await service.process_renewals(db)
    return {"message": "Renewal processing completed"}


@router.post("/process-dunning")
async def process_dunning(
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger dunning processing (admin only)"""
    service = DunningService()
    await service.process_dunning(db)
    return {"message": "Dunning processing completed"}


@router.post("/process-payment-retries")
async def process_payment_retries(
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger payment retry processing (admin only)"""
    service = RecurringBillingService()
    await service.process_payment_retries(db)
    return {"message": "Payment retry processing completed"}

