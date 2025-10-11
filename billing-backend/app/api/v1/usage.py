"""
Usage Tracking and Quota Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import License, Domain, User
from app.schemas import (
    UsageReportRequest,
    UsageReportResponse,
    QuotaResponse,
    UsageUpdateRequest
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/quota", response_model=QuotaResponse)
async def get_quota(
    user_id: str = Depends(get_current_user_id),
    license_id: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get user's quota and current usage"""
    # Get user's licenses
    query = select(License).where(License.user_id == user_id)
    
    if license_id:
        query = query.where(License.id == license_id)
    
    result = await db.execute(query)
    licenses = result.scalars().all()
    
    if not licenses:
        raise HTTPException(status_code=404, detail="No licenses found")
    
    # Aggregate quota across all licenses or return single license
    if license_id and len(licenses) == 1:
        license = licenses[0]
        return QuotaResponse(
            license_id=license.id,
            max_accounts=license.max_accounts,
            current_accounts=license.current_accounts,
            max_domains=license.max_domains,
            current_domains=license.current_domains,
            max_databases=license.max_databases,
            current_databases=license.current_databases,
            max_emails=license.max_emails,
            current_emails=license.current_emails,
            accounts_available=license.max_accounts - license.current_accounts,
            domains_available=license.max_domains - license.current_domains,
            databases_available=license.max_databases - license.current_databases,
            emails_available=license.max_emails - license.current_emails
        )
    
    # Aggregate all licenses
    total_max_accounts = sum(l.max_accounts for l in licenses)
    total_current_accounts = sum(l.current_accounts for l in licenses)
    total_max_domains = sum(l.max_domains for l in licenses)
    total_current_domains = sum(l.current_domains for l in licenses)
    total_max_databases = sum(l.max_databases for l in licenses)
    total_current_databases = sum(l.current_databases for l in licenses)
    total_max_emails = sum(l.max_emails for l in licenses)
    total_current_emails = sum(l.current_emails for l in licenses)
    
    return QuotaResponse(
        max_accounts=total_max_accounts,
        current_accounts=total_current_accounts,
        max_domains=total_max_domains,
        current_domains=total_current_domains,
        max_databases=total_max_databases,
        current_databases=total_current_databases,
        max_emails=total_max_emails,
        current_emails=total_current_emails,
        accounts_available=total_max_accounts - total_current_accounts,
        domains_available=total_max_domains - total_current_domains,
        databases_available=total_max_databases - total_current_databases,
        emails_available=total_max_emails - total_current_emails
    )


@router.post("/update", status_code=status.HTTP_200_OK)
async def update_usage(
    request: UsageUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update usage count for a license (called by NextPanel)"""
    # Get license
    result = await db.execute(
        select(License).where(
            and_(
                License.id == request.license_id,
                License.user_id == user_id
            )
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Update counts
    if request.resource_type == "accounts":
        license.current_accounts = max(0, license.current_accounts + request.delta)
    elif request.resource_type == "domains":
        license.current_domains = max(0, license.current_domains + request.delta)
    elif request.resource_type == "databases":
        license.current_databases = max(0, license.current_databases + request.delta)
    elif request.resource_type == "emails":
        license.current_emails = max(0, license.current_emails + request.delta)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid resource type: {request.resource_type}"
        )
    
    await db.commit()
    await db.refresh(license)
    
    logger.info(f"Updated usage for license {license.id}: {request.resource_type} {request.delta:+d}")
    
    return {
        "status": "success",
        "license_id": license.id,
        "resource_type": request.resource_type,
        "current_count": getattr(license, f"current_{request.resource_type}"),
        "max_count": getattr(license, f"max_{request.resource_type}")
    }


@router.get("/report", response_model=UsageReportResponse)
async def get_usage_report(
    user_id: str = Depends(get_current_user_id),
    license_id: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed usage report"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Get licenses
    query = select(License).where(License.user_id == user_id)
    if license_id:
        query = query.where(License.id == license_id)
    
    result = await db.execute(query)
    licenses = result.scalars().all()
    
    if not licenses:
        raise HTTPException(status_code=404, detail="No licenses found")
    
    # Collect usage data
    licenses_data = []
    for license in licenses:
        licenses_data.append({
            "license_id": license.id,
            "license_key": license.license_key,
            "status": license.status.value,
            "accounts": {
                "current": license.current_accounts,
                "max": license.max_accounts,
                "usage_percent": (license.current_accounts / license.max_accounts * 100) if license.max_accounts > 0 else 0
            },
            "domains": {
                "current": license.current_domains,
                "max": license.max_domains,
                "usage_percent": (license.current_domains / license.max_domains * 100) if license.max_domains > 0 else 0
            },
            "databases": {
                "current": license.current_databases,
                "max": license.max_databases,
                "usage_percent": (license.current_databases / license.max_databases * 100) if license.max_databases > 0 else 0
            },
            "emails": {
                "current": license.current_emails,
                "max": license.max_emails,
                "usage_percent": (license.current_emails / license.max_emails * 100) if license.max_emails > 0 else 0
            }
        })
    
    # Get domain registrations in period
    result = await db.execute(
        select(func.count(Domain.id))
        .where(
            and_(
                Domain.user_id == user_id,
                Domain.created_at >= start_date,
                Domain.created_at <= end_date
            )
        )
    )
    domains_registered = result.scalar() or 0
    
    return UsageReportResponse(
        start_date=start_date,
        end_date=end_date,
        licenses=licenses_data,
        summary={
            "total_licenses": len(licenses),
            "active_licenses": sum(1 for l in licenses if l.status.value == "active"),
            "domains_registered_in_period": domains_registered
        }
    )


@router.get("/alerts")
async def get_quota_alerts(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get quota usage alerts (when approaching limits)"""
    result = await db.execute(
        select(License).where(License.user_id == user_id)
    )
    licenses = result.scalars().all()
    
    alerts = []
    threshold = 0.8  # 80% threshold
    
    for license in licenses:
        # Check accounts
        if license.max_accounts > 0 and (license.current_accounts / license.max_accounts) >= threshold:
            alerts.append({
                "license_id": license.id,
                "resource": "accounts",
                "current": license.current_accounts,
                "max": license.max_accounts,
                "usage_percent": (license.current_accounts / license.max_accounts * 100),
                "severity": "warning" if (license.current_accounts / license.max_accounts) < 0.95 else "critical"
            })
        
        # Check domains
        if license.max_domains > 0 and (license.current_domains / license.max_domains) >= threshold:
            alerts.append({
                "license_id": license.id,
                "resource": "domains",
                "current": license.current_domains,
                "max": license.max_domains,
                "usage_percent": (license.current_domains / license.max_domains * 100),
                "severity": "warning" if (license.current_domains / license.max_domains) < 0.95 else "critical"
            })
        
        # Check databases
        if license.max_databases > 0 and (license.current_databases / license.max_databases) >= threshold:
            alerts.append({
                "license_id": license.id,
                "resource": "databases",
                "current": license.current_databases,
                "max": license.max_databases,
                "usage_percent": (license.current_databases / license.max_databases * 100),
                "severity": "warning" if (license.current_databases / license.max_databases) < 0.95 else "critical"
            })
        
        # Check emails
        if license.max_emails > 0 and (license.current_emails / license.max_emails) >= threshold:
            alerts.append({
                "license_id": license.id,
                "resource": "emails",
                "current": license.current_emails,
                "max": license.max_emails,
                "usage_percent": (license.current_emails / license.max_emails * 100),
                "severity": "warning" if (license.current_emails / license.max_emails) < 0.95 else "critical"
            })
    
    return {
        "alerts": alerts,
        "total_alerts": len(alerts)
    }


@router.get("/history/{license_id}")
async def get_usage_history(
    license_id: str,
    user_id: str = Depends(get_current_user_id),
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """Get historical usage data for a license"""
    # Verify license ownership
    result = await db.execute(
        select(License).where(
            and_(
                License.id == license_id,
                License.user_id == user_id
            )
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # TODO: Implement actual historical tracking with time-series data
    # For now, return current snapshot
    
    return {
        "license_id": license.id,
        "period_days": days,
        "current_usage": {
            "accounts": license.current_accounts,
            "domains": license.current_domains,
            "databases": license.current_databases,
            "emails": license.current_emails
        },
        "note": "Historical tracking to be implemented with time-series data"
    }

