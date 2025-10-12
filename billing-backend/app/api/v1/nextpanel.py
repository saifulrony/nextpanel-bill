"""
NextPanel API Endpoints
Manages multiple NextPanel servers and provisions hosting accounts
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from app.core.database import get_db
from app.services.nextpanel_service import get_nextpanel_service
# from app.core.security import get_current_admin  # Uncomment when auth is ready

router = APIRouter(prefix="/nextpanel", tags=["NextPanel Integration"])


# Schemas

class NextPanelServerCreate(BaseModel):
    name: str = Field(..., description="Server name")
    description: Optional[str] = None
    base_url: str = Field(..., description="Base URL (e.g., https://panel.example.com)")
    api_key: str = Field(..., description="API key from NextPanel")
    api_secret: str = Field(..., description="API secret from NextPanel")
    capacity: int = Field(default=100, description="Maximum accounts")
    location: Optional[str] = None
    tags: Optional[List[str]] = None


class NextPanelServerResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    base_url: str
    is_active: bool
    is_online: bool
    capacity: int
    current_accounts: int
    utilization_percent: float
    available_slots: int
    location: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class NextPanelServerStatus(BaseModel):
    server_id: str
    name: str
    url: str
    is_active: bool
    is_online: bool
    current_accounts: int
    capacity: int
    utilization: float


class AccountProvisionRequest(BaseModel):
    customer_id: str  # Changed to str to support UUID
    order_id: Optional[int] = None
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    package_id: Optional[int] = None
    server_id: Optional[int] = None  # Auto-select if None
    is_admin: bool = False  # Set to True to create reseller account
    account_type: Optional[str] = None  # 'panel', 'reseller', 'master-reseller'


class AccountProvisionResponse(BaseModel):
    success: bool
    account_id: Optional[int] = None
    server_name: Optional[str] = None
    server_url: Optional[str] = None
    nextpanel_user_id: Optional[int] = None
    username: Optional[str] = None
    error: Optional[str] = None


# Endpoints

@router.post("/servers/test", response_model=dict)
async def test_nextpanel_connection(
    server: NextPanelServerCreate,
    # current_admin = Depends(get_current_admin)  # Uncomment when auth is ready
):
    """
    Test connection to a NextPanel server without adding it
    
    This endpoint allows testing credentials and connectivity before actually adding a server.
    """
    try:
        from app.services.nextpanel_service import NextPanelServer
        
        # Create a temporary server instance
        temp_server = NextPanelServer(
            name=server.name,
            base_url=server.base_url.rstrip('/'),
            api_key=server.api_key,
            api_secret=server.api_secret,
            capacity=server.capacity
        )
        
        # Test connection
        is_online = temp_server.test_connection()
        
        if is_online:
            return {
                "success": True,
                "message": "Connection successful! Server is online.",
                "url": server.base_url
            }
        else:
            return {
                "success": False,
                "message": "Connection failed. Please check your credentials and URL.",
                "url": server.base_url
            }
            
    except Exception as e:
        logger.error(f"Connection test error: {e}")
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}",
            "url": server.base_url
        }


@router.post("/servers", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_nextpanel_server(
    server: NextPanelServerCreate,
    db: AsyncSession = Depends(get_db),
    # current_admin = Depends(get_current_admin)  # Uncomment when auth is ready
):
    """
    Add a new NextPanel server to manage
    
    **Admin only**
    
    Steps to add a server:
    1. Create API key in NextPanel (permission: BILLING)
    2. Copy key_id and key_secret
    3. Add server here with those credentials
    """
    from app.models.nextpanel_server import NextPanelServer
    
    try:
        # Check if server name already exists
        result = await db.execute(
            select(NextPanelServer).where(NextPanelServer.name == server.name)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Server with name '{server.name}' already exists"
            )
        
        # Create database record
        db_server = NextPanelServer(
            name=server.name,
            description=server.description,
            base_url=server.base_url.rstrip('/'),
            api_key=server.api_key,
            api_secret=server.api_secret,  # TODO: Encrypt this!
            capacity=server.capacity,
            location=server.location,
            tags=server.tags or []
        )
        
        db.add(db_server)
        await db.commit()
        await db.refresh(db_server)
        
        # Add to service
        nextpanel_service = get_nextpanel_service()
        success = nextpanel_service.add_server(
            server_id=str(db_server.id),
            name=server.name,
            base_url=server.base_url,
            api_key=server.api_key,
            api_secret=server.api_secret,
            capacity=server.capacity
        )
        
        if not success:
            await db.delete(db_server)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to connect to NextPanel server. Check credentials and URL."
            )
        
        return {
            "message": "Server added successfully",
            "server_id": db_server.id,
            "name": db_server.name,
            "url": db_server.base_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add server: {str(e)}"
        )


@router.get("/servers", response_model=List[NextPanelServerResponse])
async def list_nextpanel_servers(
    db: AsyncSession = Depends(get_db),
    # current_admin = Depends(get_current_admin)
):
    """List all NextPanel servers"""
    from app.models.nextpanel_server import NextPanelServer
    
    result = await db.execute(select(NextPanelServer))
    servers = result.scalars().all()
    return servers


@router.get("/servers/status", response_model=List[NextPanelServerStatus])
async def get_servers_status(
    db: AsyncSession = Depends(get_db),
    # current_admin = Depends(get_current_admin)
):
    """Get real-time status of all NextPanel servers"""
    nextpanel_service = get_nextpanel_service()
    # Load servers from database if not already loaded
    await nextpanel_service.load_servers_from_db(db)
    return nextpanel_service.get_all_servers_status()


@router.post("/provision", response_model=AccountProvisionResponse)
async def provision_hosting_account(
    request: AccountProvisionRequest,
    db: AsyncSession = Depends(get_db),
    # current_admin = Depends(get_current_admin)
):
    """
    Provision a new hosting account on NextPanel
    
    Automatically selects the best available server based on capacity.
    You can optionally specify a server_id.
    
    This endpoint should be called when:
    - Customer purchases hosting plan
    - Order is marked as paid
    """
    from app.models.nextpanel_server import NextPanelAccount
    
    try:
        nextpanel_service = get_nextpanel_service()
        # Load servers from database if not already loaded
        await nextpanel_service.load_servers_from_db(db)
        
        # Determine is_admin based on account type if not explicitly set
        is_admin = request.is_admin
        if request.account_type:
            if request.account_type in ['reseller', 'master-reseller']:
                is_admin = True
            elif request.account_type == 'panel':
                is_admin = False
        
        # Create account
        result = nextpanel_service.create_account(
            username=request.username,
            email=request.email,
            password=request.password,
            full_name=request.full_name,
            phone=request.phone,
            company=request.company,
            package_id=request.package_id,
            billing_customer_id=str(request.customer_id),
            server_id=str(request.server_id) if request.server_id else None,
            is_admin=is_admin,  # Pass through is_admin flag
            account_type=request.account_type  # Pass account type for logging
        )
        
        if not result['success']:
            return AccountProvisionResponse(
                success=False,
                error=result.get('error', 'Unknown error')
            )
        
        # Save to database
        account = NextPanelAccount(
            customer_id=request.customer_id,
            order_id=request.order_id,
            server_id=request.server_id or int(result['account']['id']),  # TODO: Fix server_id mapping
            nextpanel_user_id=result['nextpanel_user_id'],
            username=request.username,
            email=request.email,
            status="active",
            meta_data={
                "server_name": result['server_name'],
                "server_url": result['server_url'],
                "created_at": datetime.utcnow().isoformat()
            }
        )
        
        db.add(account)
        await db.commit()
        await db.refresh(account)
        
        return AccountProvisionResponse(
            success=True,
            account_id=account.id,
            server_name=result['server_name'],
            server_url=result['server_url'],
            nextpanel_user_id=result['nextpanel_user_id'],
            username=request.username
        )
        
    except Exception as e:
        await db.rollback()
        return AccountProvisionResponse(
            success=False,
            error=str(e)
        )


@router.post("/accounts/{account_id}/suspend")
async def suspend_hosting_account(
    account_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    # current_admin = Depends(get_current_admin)
):
    """
    Suspend a hosting account
    
    Call this when:
    - Payment is overdue
    - Customer violates terms
    - Manual suspension needed
    """
    from app.models.nextpanel_server import NextPanelAccount
    
    try:
        result = await db.execute(
            select(NextPanelAccount).where(NextPanelAccount.id == account_id)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        nextpanel_service = get_nextpanel_service()
        success = nextpanel_service.suspend_account(
            server_id=str(account.server_id),
            user_id=account.nextpanel_user_id,
            reason=reason
        )
        
        if success:
            account.status = "suspended"
            account.suspension_reason = reason
            account.suspended_at = datetime.utcnow()
            await db.commit()
            
            return {"message": "Account suspended successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to suspend account on NextPanel"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.post("/accounts/{account_id}/unsuspend")
async def unsuspend_hosting_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    # current_admin = Depends(get_current_admin)
):
    """
    Unsuspend a hosting account
    
    Call this when:
    - Payment received
    - Issue resolved
    """
    from app.models.nextpanel_server import NextPanelAccount
    
    try:
        result = await db.execute(
            select(NextPanelAccount).where(NextPanelAccount.id == account_id)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        nextpanel_service = get_nextpanel_service()
        success = nextpanel_service.unsuspend_account(
            server_id=str(account.server_id),
            user_id=account.nextpanel_user_id
        )
        
        if success:
            account.status = "active"
            account.suspension_reason = None
            account.suspended_at = None
            await db.commit()
            
            return {"message": "Account unsuspended successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to unsuspend account on NextPanel"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.delete("/accounts/{account_id}")
async def delete_hosting_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    # current_admin = Depends(get_current_admin)
):
    """
    Delete a hosting account permanently
    
    ⚠️ Warning: This is irreversible!
    
    Call this when:
    - Customer cancels service
    - Refund processed
    """
    from app.models.nextpanel_server import NextPanelAccount
    
    try:
        result = await db.execute(
            select(NextPanelAccount).where(NextPanelAccount.id == account_id)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        nextpanel_service = get_nextpanel_service()
        success = nextpanel_service.delete_account(
            server_id=str(account.server_id),
            user_id=account.nextpanel_user_id
        )
        
        if success:
            account.status = "deleted"
            account.deleted_at = datetime.utcnow()
            await db.commit()
            
            return {"message": "Account deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete account on NextPanel"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.get("/accounts/{account_id}/stats")
async def get_account_stats(
    account_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get resource usage statistics for an account"""
    from app.models.nextpanel_server import NextPanelAccount
    
    try:
        result = await db.execute(
            select(NextPanelAccount).where(NextPanelAccount.id == account_id)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found"
            )
        
        nextpanel_service = get_nextpanel_service()
        stats = nextpanel_service.get_account_stats(
            server_id=str(account.server_id),
            user_id=account.nextpanel_user_id
        )
        
        if stats:
            return stats
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get account statistics"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {str(e)}"
        )


@router.get("/accounts/counts/by-role")
async def get_account_counts_by_role(
    db: AsyncSession = Depends(get_db),
):
    """Get count of accounts by role/account type"""
    from app.models.nextpanel_server import NextPanelAccount
    
    try:
        result = await db.execute(
            select(NextPanelAccount).where(NextPanelAccount.status == "active")
        )
        accounts = result.scalars().all()
        
        # Count accounts by role from metadata
        counts = {
            "panel": 0,
            "reseller": 0,
            "master-reseller": 0,
            "unknown": 0
        }
        
        for account in accounts:
            if account.meta_data:
                account_type = account.meta_data.get('account_type') or account.meta_data.get('account_level')
                if account_type == 'panel':
                    counts['panel'] += 1
                elif account_type == 'reseller':
                    counts['reseller'] += 1
                elif account_type == 'master-reseller':
                    counts['master-reseller'] += 1
                else:
                    # Check legacy is_admin flag
                    if account.meta_data.get('is_admin', False):
                        counts['reseller'] += 1  # Legacy reseller accounts
                    else:
                        counts['panel'] += 1  # Legacy panel accounts
            else:
                counts['unknown'] += 1
        
        return {
            "total_accounts": len(accounts),
            "by_role": counts,
            "summary": {
                "regular_users": counts['panel'],
                "reseller_users": counts['reseller'],
                "master_reseller_users": counts['master-reseller'],
                "unknown_accounts": counts['unknown']
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting account counts: {str(e)}"
        )

