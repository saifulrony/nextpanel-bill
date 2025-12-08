"""
Staff Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import (
    User, StaffRole, StaffPermission, StaffRolePermission, UserRole,
    ChatSession, SupportTicket, TicketReply, StaffAuditLog, StaffActivityLog,
    UserPermissionOverride, PermissionGroup, PermissionGroupPermission
)
from app.schemas import (
    StaffRoleCreate,
    StaffRoleUpdate,
    StaffRoleResponse,
    StaffRoleWithPermissions,
    StaffPermissionCreate,
    StaffPermissionResponse,
    StaffRolePermissionResponse,
    AssignPermissionRequest,
    AssignRoleRequest,
    UserRoleResponse,
    BulkAssignRoleRequest,
    BulkUpdateStatusRequest
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/staff", tags=["staff"])


async def verify_admin(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """Verify user has admin privileges"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user_id


# Staff Roles Management
@router.get("/roles", response_model=List[StaffRoleResponse])
async def list_roles(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
    include_inactive: bool = False
):
    """List all staff roles"""
    query = select(StaffRole)
    if not include_inactive:
        query = query.where(StaffRole.is_active == True)
    query = query.order_by(StaffRole.name)
    
    result = await db.execute(query)
    roles = result.scalars().all()
    return roles


@router.get("/roles/{role_id}", response_model=StaffRoleWithPermissions)
async def get_role(
    role_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific role with its permissions"""
    result = await db.execute(
        select(StaffRole).where(StaffRole.id == role_id)
    )
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Get permissions for this role
    permissions_result = await db.execute(
        select(StaffPermission)
        .join(StaffRolePermission)
        .where(StaffRolePermission.role_id == role_id)
    )
    permissions = permissions_result.scalars().all()
    
    # Convert to response model
    role_dict = {
        "id": role.id,
        "name": role.name,
        "display_name": role.display_name,
        "description": role.description,
        "is_active": role.is_active,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "permissions": [
            {
                "id": p.id,
                "name": p.name,
                "display_name": p.display_name,
                "description": p.description,
                "category": p.category,
                "created_at": p.created_at,
                "updated_at": p.updated_at
            }
            for p in permissions
        ]
    }
    
    return role_dict


@router.post("/roles", response_model=StaffRoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: StaffRoleCreate,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new staff role"""
    from app.core.audit import log_audit_action
    
    # Check if role name already exists
    result = await db.execute(
        select(StaffRole).where(StaffRole.name == role_data.name)
    )
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists"
        )
    
    new_role = StaffRole(
        name=role_data.name,
        display_name=role_data.display_name,
        description=role_data.description,
        is_active=role_data.is_active,
        level=getattr(role_data, 'level', 0),
        parent_role_id=getattr(role_data, 'parent_role_id', None)
    )
    
    db.add(new_role)
    await db.commit()
    await db.refresh(new_role)
    
    await log_audit_action(
        db, "role_created", admin_id,
        target_role_id=new_role.id,
        details={"name": new_role.name, "display_name": new_role.display_name}
    )
    
    return new_role


@router.patch("/roles/{role_id}", response_model=StaffRoleResponse)
async def update_role(
    role_id: str,
    role_data: StaffRoleUpdate,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a staff role"""
    result = await db.execute(
        select(StaffRole).where(StaffRole.id == role_id)
    )
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    if role_data.display_name is not None:
        role.display_name = role_data.display_name
    if role_data.description is not None:
        role.description = role_data.description
    if role_data.is_active is not None:
        role.is_active = role_data.is_active
    
    await db.commit()
    await db.refresh(role)
    
    return role


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a staff role"""
    result = await db.execute(
        select(StaffRole).where(StaffRole.id == role_id)
    )
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    await db.delete(role)
    await db.commit()
    
    return None


# Permissions Management
@router.get("/permissions", response_model=List[StaffPermissionResponse])
async def list_permissions(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None
):
    """List all available permissions"""
    query = select(StaffPermission)
    if category:
        query = query.where(StaffPermission.category == category)
    query = query.order_by(StaffPermission.category, StaffPermission.name)
    
    result = await db.execute(query)
    permissions = result.scalars().all()
    return permissions


@router.post("/permissions", response_model=StaffPermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission_data: StaffPermissionCreate,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new permission"""
    # Check if permission name already exists
    result = await db.execute(
        select(StaffPermission).where(StaffPermission.name == permission_data.name)
    )
    existing = result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission with this name already exists"
        )
    
    new_permission = StaffPermission(
        name=permission_data.name,
        display_name=permission_data.display_name,
        description=permission_data.description,
        category=permission_data.category
    )
    
    db.add(new_permission)
    await db.commit()
    await db.refresh(new_permission)
    
    return new_permission


# Role-Permission Assignment
@router.post("/roles/{role_id}/permissions", response_model=List[StaffPermissionResponse])
async def assign_permissions_to_role(
    role_id: str,
    request: AssignPermissionRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Assign permissions to a role"""
    # Verify role exists
    role_result = await db.execute(
        select(StaffRole).where(StaffRole.id == role_id)
    )
    role = role_result.scalars().first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Remove existing permissions for this role
    existing_result = await db.execute(
        select(StaffRolePermission).where(StaffRolePermission.role_id == role_id)
    )
    existing_permissions = existing_result.scalars().all()
    for ep in existing_permissions:
        await db.delete(ep)
    
    # Add new permissions
    for permission_id in request.permission_ids:
        # Verify permission exists
        perm_result = await db.execute(
            select(StaffPermission).where(StaffPermission.id == permission_id)
        )
        permission = perm_result.scalars().first()
        if not permission:
            continue  # Skip invalid permission IDs
        
        # Create new role-permission assignment
        role_permission = StaffRolePermission(
            role_id=role_id,
            permission_id=permission_id
        )
        db.add(role_permission)
    
    await db.commit()
    
    # Return updated permissions list
    permissions_result = await db.execute(
        select(StaffPermission)
        .join(StaffRolePermission)
        .where(StaffRolePermission.role_id == role_id)
    )
    permissions = permissions_result.scalars().all()
    
    return permissions


@router.get("/roles/{role_id}/permissions", response_model=List[StaffPermissionResponse])
async def get_role_permissions(
    role_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all permissions for a role"""
    result = await db.execute(
        select(StaffPermission)
        .join(StaffRolePermission)
        .where(StaffRolePermission.role_id == role_id)
    )
    permissions = result.scalars().all()
    return permissions


# User-Role Assignment
@router.post("/users/assign-role", response_model=UserRoleResponse)
async def assign_role_to_user(
    request: AssignRoleRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Assign a role to a user"""
    # Verify user exists
    user_result = await db.execute(
        select(User).where(User.id == request.user_id)
    )
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify role exists
    role_result = await db.execute(
        select(StaffRole).where(StaffRole.id == request.role_id)
    )
    role = role_result.scalars().first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Check if user already has this role
    existing_result = await db.execute(
        select(UserRole).where(
            and_(
                UserRole.user_id == request.user_id,
                UserRole.role_id == request.role_id
            )
        )
    )
    existing = existing_result.scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has this role"
        )
    
    # Create user role assignment
    user_role = UserRole(
        user_id=request.user_id,
        role_id=request.role_id,
        assigned_by=admin_id,
        expires_at=request.expires_at
    )
    
    db.add(user_role)
    await db.commit()
    await db.refresh(user_role)
    
    # Log audit action
    from app.core.audit import log_audit_action
    await log_audit_action(
        db, "role_assigned", admin_id,
        target_user_id=request.user_id,
        target_role_id=request.role_id,
        details={"expires_at": request.expires_at.isoformat() if request.expires_at else None}
    )
    
    # Load relationships for response
    await db.refresh(user_role, ["role", "user"])
    
    return user_role


@router.get("/users/me/roles", response_model=List[UserRoleResponse])
async def get_my_roles(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all roles assigned to the current user (no admin required)"""
    result = await db.execute(
        select(UserRole).where(UserRole.user_id == user_id)
    )
    user_roles = result.scalars().all()
    
    # Load relationships
    for ur in user_roles:
        await db.refresh(ur, ["role", "user"])
    
    return user_roles


@router.get("/users/{user_id}/roles", response_model=List[UserRoleResponse])
async def get_user_roles(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all roles assigned to a user (admin only)"""
    result = await db.execute(
        select(UserRole).where(UserRole.user_id == user_id)
    )
    user_roles = result.scalars().all()
    
    # Load relationships
    for ur in user_roles:
        await db.refresh(ur, ["role", "user"])
    
    return user_roles


@router.get("/users", response_model=List[dict])
async def list_staff_users(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
    staff_only: bool = False
):
    """List all users with their assigned roles and performance metrics
    
    Args:
        staff_only: If True, only return users with assigned roles. If False, return all users.
    """
    if staff_only:
        # Get only users who have at least one role assigned
        users_result = await db.execute(
            select(User)
            .join(UserRole)
            .distinct()
            .order_by(User.created_at.desc())
        )
        users = users_result.scalars().all()
    else:
        # Get all users so admins can assign roles
        users_result = await db.execute(select(User).order_by(User.created_at.desc()))
        users = users_result.scalars().all()
    
    # Build response with roles and performance metrics for each user
    users_list = []
    for user in users:
        # Get roles for this user
        roles_result = await db.execute(
            select(UserRole, StaffRole)
            .join(StaffRole, UserRole.role_id == StaffRole.id)
            .where(UserRole.user_id == user.id)
        )
        user_roles_data = roles_result.all()
        
        roles = []
        for ur, role in user_roles_data:
            roles.append({
                "id": role.id,
                "name": role.name,
                "display_name": role.display_name,
                "assigned_at": ur.assigned_at.isoformat() if ur.assigned_at else None
            })
        
        # Get performance metrics
        # Count total chats assigned to this user
        total_chats_result = await db.execute(
            select(func.count(ChatSession.id))
            .where(ChatSession.assigned_to == user.id)
        )
        total_chats = total_chats_result.scalar() or 0
        
        # Count chats ended/closed by this user (status is a string, not enum)
        chats_ended_result = await db.execute(
            select(func.count(ChatSession.id))
            .where(
                and_(
                    ChatSession.assigned_to == user.id,
                    or_(
                        ChatSession.status == "closed",
                        ChatSession.status == "archived"
                    )
                )
            )
        )
        chats_ended = chats_ended_result.scalar() or 0
        
        # Count tickets assigned and resolved by this user
        tickets_assigned_result = await db.execute(
            select(func.count(SupportTicket.id))
            .where(SupportTicket.assigned_to == user.id)
        )
        total_tickets_assigned = tickets_assigned_result.scalar() or 0
        
        tickets_resolved_result = await db.execute(
            select(func.count(SupportTicket.id))
            .where(
                and_(
                    SupportTicket.assigned_to == user.id,
                    or_(
                        SupportTicket.status == "resolved",
                        SupportTicket.status == "closed"
                    )
                )
            )
        )
        tickets_resolved = tickets_resolved_result.scalar() or 0
        
        # Calculate average rating from chats
        ratings_result = await db.execute(
            select(func.avg(ChatSession.rating))
            .where(
                and_(
                    ChatSession.assigned_to == user.id,
                    ChatSession.rating.isnot(None)
                )
            )
        )
        average_rating = ratings_result.scalar()
        if average_rating:
            average_rating = round(float(average_rating), 2)
        else:
            average_rating = None
        
        # Count total ratings
        ratings_count_result = await db.execute(
            select(func.count(ChatSession.id))
            .where(
                and_(
                    ChatSession.assigned_to == user.id,
                    ChatSession.rating.isnot(None)
                )
            )
        )
        ratings_count = ratings_count_result.scalar() or 0
        
        users_list.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "company_name": user.company_name,
            "is_active": user.is_active,
            "is_admin": user.is_admin,
            "roles": roles,
            "performance": {
                "total_chats": total_chats,
                "chats_ended": chats_ended,
                "total_tickets_assigned": total_tickets_assigned,
                "tickets_resolved": tickets_resolved,
                "average_rating": average_rating,
                "ratings_count": ratings_count
            }
        })
    
    return users_list


@router.get("/permissions/me", response_model=List[str])
async def get_my_permissions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all permissions for the current user"""
    from app.core.security import get_user_permissions
    permissions = await get_user_permissions(user_id, db)
    return permissions


@router.get("/permissions/user/{user_id}", response_model=List[str])
async def get_user_permissions_endpoint(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all permissions for a specific user (admin only)"""
    from app.core.security import get_user_permissions
    permissions = await get_user_permissions(user_id, db)
    return permissions


@router.delete("/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_user(
    user_id: str,
    role_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Remove a role from a user"""
    from app.core.audit import log_audit_action
    
    result = await db.execute(
        select(UserRole).where(
            and_(
                UserRole.user_id == user_id,
                UserRole.role_id == role_id
            )
        )
    )
    user_role = result.scalars().first()
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User role assignment not found"
        )
    
    await db.delete(user_role)
    await db.commit()
    
    await log_audit_action(
        db, "role_removed", admin_id,
        target_user_id=user_id,
        target_role_id=role_id
    )
    
    return None


@router.post("/initialize-defaults", status_code=status.HTTP_201_CREATED)
async def initialize_defaults(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Initialize default permissions and roles"""
    # Default permissions - Page-level access control
    default_permissions = [
        # Dashboard
        {"name": "access_dashboard_page", "display_name": "Dashboard Page", "description": "Access to /admin/dashboard", "category": "Pages"},
        
        # Customer Management
        {"name": "access_customers_page", "display_name": "Customers Page", "description": "Access to /admin/customers", "category": "Pages"},
        
        # Products
        {"name": "access_products_page", "display_name": "Products Page", "description": "Access to /admin/products", "category": "Pages"},
        
        # Orders
        {"name": "access_orders_page", "display_name": "Orders Page", "description": "Access to /admin/orders", "category": "Pages"},
        
        # Licenses
        {"name": "access_licenses_page", "display_name": "Licenses Page", "description": "Access to /admin/licenses", "category": "Pages"},
        
        # Domains
        {"name": "access_domains_search_page", "display_name": "Domains Search Page", "description": "Access to /admin/domains", "category": "Pages"},
        {"name": "access_domains_providers_page", "display_name": "Domain Providers Page", "description": "Access to /admin/domain-providers", "category": "Pages"},
        {"name": "access_domains_pricing_page", "display_name": "Domain Pricing Page", "description": "Access to /admin/domain-pricing", "category": "Pages"},
        
        # Subscriptions
        {"name": "access_subscriptions_page", "display_name": "Subscriptions Page", "description": "Access to /admin/subscriptions", "category": "Pages"},
        
        # Payments
        {"name": "access_payments_transactions_page", "display_name": "Payments Transactions Page", "description": "Access to /admin/payments", "category": "Pages"},
        {"name": "access_payments_gateways_page", "display_name": "Payment Gateways Page", "description": "Access to /admin/payments/gateways", "category": "Pages"},
        
        # Server & Backup
        {"name": "access_server_page", "display_name": "Server Page", "description": "Access to /admin/server", "category": "Pages"},
        {"name": "access_backup_page", "display_name": "Backup Page", "description": "Access to /admin/backup", "category": "Pages"},
        
        # Analytics
        {"name": "access_analytics_overview_page", "display_name": "Analytics Overview Page", "description": "Access to /admin/analytics", "category": "Pages"},
        {"name": "access_analytics_sales_page", "display_name": "Analytics Sales Page", "description": "Access to /admin/analytics/sales", "category": "Pages"},
        {"name": "access_analytics_clients_page", "display_name": "Analytics Clients Page", "description": "Access to /admin/analytics/clients", "category": "Pages"},
        {"name": "access_analytics_orders_page", "display_name": "Analytics Orders Page", "description": "Access to /admin/analytics/orders", "category": "Pages"},
        {"name": "access_analytics_tickets_page", "display_name": "Analytics Tickets Page", "description": "Access to /admin/analytics/tickets", "category": "Pages"},
        
        # Support
        {"name": "access_support_tickets_page", "display_name": "Support Tickets Page", "description": "Access to /admin/support", "category": "Pages"},
        {"name": "access_support_chats_page", "display_name": "Live Chats Page", "description": "Access to /admin/support/chats", "category": "Pages"},
        
        # Marketplace
        {"name": "access_marketplace_page", "display_name": "Marketplace Page", "description": "Access to /admin/marketplace", "category": "Pages"},
        
        # Customization
        {"name": "access_customization_page", "display_name": "Customization Page", "description": "Access to /admin/customization", "category": "Pages"},
        
        # Staff Management
        {"name": "access_stuffs_page", "display_name": "Staff Management Page", "description": "Access to /admin/stuffs", "category": "Pages"},
        
        # Settings
        {"name": "access_settings_page", "display_name": "Settings Page", "description": "Access to /admin/settings", "category": "Pages"},
        
        # Action Permissions (for backward compatibility and specific actions)
        {"name": "access_chat", "display_name": "Access Chat", "description": "Can access chat functionality", "category": "Actions"},
        {"name": "access_tickets", "display_name": "Access Tickets", "description": "Can access ticket functionality", "category": "Actions"},
        {"name": "manage_customers", "display_name": "Manage Customers", "description": "Can create, edit, delete customers", "category": "Actions"},
        {"name": "manage_orders", "display_name": "Manage Orders", "description": "Can create, edit, update order status", "category": "Actions"},
        {"name": "manage_products", "display_name": "Manage Products", "description": "Can create, edit, delete products", "category": "Actions"},
        {"name": "manage_payments", "display_name": "Manage Payments", "description": "Can process refunds, view payment details", "category": "Actions"},
        {"name": "view_analytics", "display_name": "View Analytics", "description": "Can view analytics and reports", "category": "Actions"},
        {"name": "manage_settings", "display_name": "Manage Settings", "description": "Can modify system settings", "category": "Actions"},
        {"name": "manage_staff", "display_name": "Manage Staff", "description": "Can manage staff roles and permissions", "category": "Actions"},
    ]
    
    created_permissions = []
    for perm_data in default_permissions:
        # Check if permission already exists
        result = await db.execute(
            select(StaffPermission).where(StaffPermission.name == perm_data["name"])
        )
        existing = result.scalars().first()
        if not existing:
            permission = StaffPermission(**perm_data)
            db.add(permission)
            created_permissions.append(permission)
    
    # Default roles
    default_roles = [
        {"name": "manager", "display_name": "Manager", "description": "Full management access", "is_active": True},
        {"name": "support", "display_name": "Support Staff", "description": "Support staff with chat and ticket access", "is_active": True},
        {"name": "editor", "display_name": "Editor", "description": "Content editor with limited access", "is_active": True},
    ]
    
    created_roles = []
    for role_data in default_roles:
        # Check if role already exists
        result = await db.execute(
            select(StaffRole).where(StaffRole.name == role_data["name"])
        )
        existing = result.scalars().first()
        if not existing:
            role = StaffRole(**role_data)
            db.add(role)
            created_roles.append(role)
    
    await db.commit()
    
    # Refresh created objects
    for perm in created_permissions:
        await db.refresh(perm)
    for role in created_roles:
        await db.refresh(role)
    
    # Assign default permissions to support role
    support_role_result = await db.execute(
        select(StaffRole).where(StaffRole.name == "support")
    )
    support_role = support_role_result.scalars().first()
    
    if support_role:
        # Get chat and ticket permissions
        chat_perm_result = await db.execute(
            select(StaffPermission).where(StaffPermission.name == "access_chat")
        )
        ticket_perm_result = await db.execute(
            select(StaffPermission).where(StaffPermission.name == "access_tickets")
        )
        chat_perm = chat_perm_result.scalars().first()
        ticket_perm = ticket_perm_result.scalars().first()
        
        if chat_perm:
            # Check if already assigned
            existing_result = await db.execute(
                select(StaffRolePermission).where(
                    and_(
                        StaffRolePermission.role_id == support_role.id,
                        StaffRolePermission.permission_id == chat_perm.id
                    )
                )
            )
            if not existing_result.scalars().first():
                role_perm = StaffRolePermission(role_id=support_role.id, permission_id=chat_perm.id)
                db.add(role_perm)
        
        if ticket_perm:
            # Check if already assigned
            existing_result = await db.execute(
                select(StaffRolePermission).where(
                    and_(
                        StaffRolePermission.role_id == support_role.id,
                        StaffRolePermission.permission_id == ticket_perm.id
                    )
                )
            )
            if not existing_result.scalars().first():
                role_perm = StaffRolePermission(role_id=support_role.id, permission_id=ticket_perm.id)
                db.add(role_perm)
    
    await db.commit()
    
    return {
        "message": "Default permissions and roles initialized",
        "permissions_created": len(created_permissions),
        "roles_created": len(created_roles)
    }


# Role Cloning
@router.post("/roles/{role_id}/clone", response_model=StaffRoleResponse)
async def clone_role(
    role_id: str,
    new_name: str,
    new_display_name: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Clone a role with all its permissions"""
    from app.core.audit import log_audit_action
    from fastapi import Request
    
    # Get original role
    role_result = await db.execute(select(StaffRole).where(StaffRole.id == role_id))
    original_role = role_result.scalars().first()
    
    if not original_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if new name already exists
    existing_result = await db.execute(select(StaffRole).where(StaffRole.name == new_name))
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    # Create new role
    new_role = StaffRole(
        name=new_name,
        display_name=new_display_name,
        description=f"Cloned from {original_role.display_name}",
        is_active=original_role.is_active,
        level=original_role.level,
        parent_role_id=original_role.parent_role_id
    )
    db.add(new_role)
    await db.flush()
    
    # Copy permissions
    perms_result = await db.execute(
        select(StaffRolePermission).where(StaffRolePermission.role_id == role_id)
    )
    permissions = perms_result.scalars().all()
    
    for perm in permissions:
        new_perm = StaffRolePermission(role_id=new_role.id, permission_id=perm.permission_id)
        db.add(new_perm)
    
    await db.commit()
    await db.refresh(new_role)
    
    await log_audit_action(
        db, "role_cloned", admin_id,
        target_role_id=role_id,
        details={"new_role_id": new_role.id, "new_name": new_name}
    )
    
    return new_role


# Permission Groups
@router.get("/permission-groups", response_model=List[dict])
async def list_permission_groups(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all permission groups"""
    result = await db.execute(select(PermissionGroup))
    groups = result.scalars().all()
    
    groups_list = []
    for group in groups:
        perms_result = await db.execute(
            select(StaffPermission)
            .join(PermissionGroupPermission)
            .where(PermissionGroupPermission.group_id == group.id)
        )
        permissions = perms_result.scalars().all()
        
        groups_list.append({
            "id": group.id,
            "name": group.name,
            "display_name": group.display_name,
            "description": group.description,
            "permissions": [{"id": p.id, "name": p.name, "display_name": p.display_name} for p in permissions]
        })
    
    return groups_list


@router.post("/permission-groups", response_model=dict)
async def create_permission_group(
    name: str,
    display_name: str,
    description: Optional[str] = None,
    permission_ids: Optional[List[str]] = None,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a permission group"""
    from app.core.audit import log_audit_action
    
    # Check if name exists
    existing_result = await db.execute(select(PermissionGroup).where(PermissionGroup.name == name))
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Group name already exists")
    
    group = PermissionGroup(
        name=name,
        display_name=display_name,
        description=description
    )
    db.add(group)
    await db.flush()
    
    # Add permissions
    if permission_ids:
        for perm_id in permission_ids:
            group_perm = PermissionGroupPermission(group_id=group.id, permission_id=perm_id)
            db.add(group_perm)
    
    await db.commit()
    await db.refresh(group)
    
    await log_audit_action(db, "permission_group_created", admin_id, details={"group_id": group.id})
    
    return {
        "id": group.id,
        "name": group.name,
        "display_name": group.display_name,
        "description": group.description
    }


@router.post("/permission-groups/{group_id}/permissions", response_model=dict)
async def assign_permissions_to_group(
    group_id: str,
    permission_ids: List[str],
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Assign permissions to a group"""
    from app.core.audit import log_audit_action
    
    group_result = await db.execute(select(PermissionGroup).where(PermissionGroup.id == group_id))
    group = group_result.scalars().first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Remove existing permissions
    await db.execute(
        select(PermissionGroupPermission).where(PermissionGroupPermission.group_id == group_id)
    )
    existing_perms = await db.execute(
        select(PermissionGroupPermission).where(PermissionGroupPermission.group_id == group_id)
    )
    for perm in existing_perms.scalars().all():
        await db.delete(perm)
    
    # Add new permissions
    for perm_id in permission_ids:
        group_perm = PermissionGroupPermission(group_id=group_id, permission_id=perm_id)
        db.add(group_perm)
    
    await db.commit()
    
    await log_audit_action(db, "permission_group_updated", admin_id, details={"group_id": group_id})
    
    return {"message": "Permissions assigned to group"}


# Permission Overrides
@router.get("/users/{user_id}/permission-overrides", response_model=List[dict])
async def get_user_permission_overrides(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get permission overrides for a user"""
    result = await db.execute(
        select(UserPermissionOverride)
        .join(StaffPermission)
        .where(UserPermissionOverride.user_id == user_id)
    )
    overrides = result.scalars().all()
    
    return [{
        "id": o.id,
        "permission": {
            "id": o.permission.id,
            "name": o.permission.name,
            "display_name": o.permission.display_name
        },
        "is_allowed": o.is_allowed,
        "expires_at": o.expires_at.isoformat() if o.expires_at else None,
        "created_at": o.created_at.isoformat()
    } for o in overrides]


@router.post("/users/{user_id}/permission-overrides", response_model=dict)
async def create_permission_override(
    user_id: str,
    permission_id: str,
    is_allowed: bool,
    expires_at: Optional[datetime] = None,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a permission override for a user"""
    from app.core.audit import log_audit_action
    
    # Check if user exists
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalars().first():
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if permission exists
    perm_result = await db.execute(select(StaffPermission).where(StaffPermission.id == permission_id))
    if not perm_result.scalars().first():
        raise HTTPException(status_code=404, detail="Permission not found")
    
    override = UserPermissionOverride(
        user_id=user_id,
        permission_id=permission_id,
        is_allowed=is_allowed,
        expires_at=expires_at,
        created_by=admin_id
    )
    db.add(override)
    await db.commit()
    await db.refresh(override)
    
    await log_audit_action(
        db, "permission_override_created", admin_id,
        target_user_id=user_id,
        target_permission_id=permission_id,
        details={"is_allowed": is_allowed, "expires_at": expires_at.isoformat() if expires_at else None}
    )
    
    return {
        "id": override.id,
        "message": "Permission override created"
    }


@router.delete("/users/{user_id}/permission-overrides/{override_id}")
async def delete_permission_override(
    user_id: str,
    override_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a permission override"""
    from app.core.audit import log_audit_action
    
    result = await db.execute(
        select(UserPermissionOverride).where(
            and_(
                UserPermissionOverride.id == override_id,
                UserPermissionOverride.user_id == user_id
            )
        )
    )
    override = result.scalars().first()
    
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")
    
    await db.delete(override)
    await db.commit()
    
    await log_audit_action(
        db, "permission_override_deleted", admin_id,
        target_user_id=user_id,
        target_permission_id=override.permission_id
    )
    
    return {"message": "Permission override deleted"}


# Audit Logs
@router.get("/audit-logs", response_model=List[dict])
async def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    action_type: Optional[str] = None,
    user_id: Optional[str] = None,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get audit logs"""
    query = select(StaffAuditLog)
    
    if action_type:
        query = query.where(StaffAuditLog.action_type == action_type)
    if user_id:
        query = query.where(StaffAuditLog.performed_by == user_id)
    
    query = query.order_by(StaffAuditLog.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [{
        "id": log.id,
        "action_type": log.action_type,
        "performed_by": log.performed_by,
        "target_user_id": log.target_user_id,
        "target_role_id": log.target_role_id,
        "target_permission_id": log.target_permission_id,
        "details": log.details,
        "ip_address": log.ip_address,
        "user_agent": log.user_agent,
        "created_at": log.created_at.isoformat()
    } for log in logs]


# Activity Logs
@router.get("/activity-logs", response_model=List[dict])
async def get_activity_logs(
    user_id: Optional[str] = None,
    action_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get activity logs"""
    query = select(StaffActivityLog)
    
    if user_id:
        query = query.where(StaffActivityLog.user_id == user_id)
    if action_type:
        query = query.where(StaffActivityLog.action_type == action_type)
    if entity_type:
        query = query.where(StaffActivityLog.entity_type == entity_type)
    
    query = query.order_by(StaffActivityLog.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [{
        "id": log.id,
        "user_id": log.user_id,
        "action_type": log.action_type,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "description": log.description,
        "metadata": log.action_metadata,
        "ip_address": log.ip_address,
        "user_agent": log.user_agent,
        "created_at": log.created_at.isoformat()
    } for log in logs]


# Bulk Operations
@router.post("/users/bulk-assign-role", response_model=dict)
async def bulk_assign_role(
    request: BulkAssignRoleRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Bulk assign role to multiple users"""
    from app.core.audit import log_audit_action
    
    role_result = await db.execute(select(StaffRole).where(StaffRole.id == request.role_id))
    role = role_result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    assigned_count = 0
    for user_id in request.user_ids:
        # Check if already assigned
        existing_result = await db.execute(
            select(UserRole).where(
                and_(
                    UserRole.user_id == user_id,
                    UserRole.role_id == request.role_id
                )
            )
        )
        if not existing_result.scalars().first():
            user_role = UserRole(
                user_id=user_id,
                role_id=request.role_id,
                assigned_by=admin_id,
                expires_at=request.expires_at
            )
            db.add(user_role)
            assigned_count += 1
    
    await db.commit()
    
    await log_audit_action(
        db, "bulk_role_assigned", admin_id,
        target_role_id=request.role_id,
        details={"user_ids": request.user_ids, "count": assigned_count}
    )
    
    return {"message": f"Role assigned to {assigned_count} users", "count": assigned_count}


@router.post("/users/bulk-update-status", response_model=dict)
async def bulk_update_user_status(
    request: BulkUpdateStatusRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Bulk activate/deactivate users"""
    from app.core.audit import log_audit_action
    
    updated_count = 0
    for user_id in request.user_ids:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalars().first()
        if user:
            user.is_active = request.is_active
            updated_count += 1
    
    await db.commit()
    
    await log_audit_action(
        db, "bulk_user_status_updated", admin_id,
        details={"user_ids": request.user_ids, "is_active": request.is_active, "count": updated_count}
    )
    
    return {"message": f"Updated {updated_count} users", "count": updated_count}


# Export/Import
@router.get("/roles/{role_id}/export", response_model=dict)
async def export_role(
    role_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Export role configuration"""
    role_result = await db.execute(select(StaffRole).where(StaffRole.id == role_id))
    role = role_result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Get permissions
    perms_result = await db.execute(
        select(StaffPermission)
        .join(StaffRolePermission)
        .where(StaffRolePermission.role_id == role_id)
    )
    permissions = perms_result.scalars().all()
    
    return {
        "role": {
            "name": role.name,
            "display_name": role.display_name,
            "description": role.description,
            "level": role.level,
            "parent_role_id": role.parent_role_id
        },
        "permissions": [{"name": p.name, "display_name": p.display_name} for p in permissions]
    }


@router.post("/roles/import", response_model=StaffRoleResponse)
async def import_role(
    role_data: dict,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Import role configuration"""
    from app.core.audit import log_audit_action
    
    # Check if role name exists
    existing_result = await db.execute(select(StaffRole).where(StaffRole.name == role_data["role"]["name"]))
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    # Create role
    new_role = StaffRole(
        name=role_data["role"]["name"],
        display_name=role_data["role"]["display_name"],
        description=role_data["role"].get("description"),
        level=role_data["role"].get("level", 0),
        parent_role_id=role_data["role"].get("parent_role_id")
    )
    db.add(new_role)
    await db.flush()
    
    # Assign permissions
    for perm_data in role_data.get("permissions", []):
        perm_result = await db.execute(
            select(StaffPermission).where(StaffPermission.name == perm_data["name"])
        )
        permission = perm_result.scalars().first()
        if permission:
            role_perm = StaffRolePermission(role_id=new_role.id, permission_id=permission.id)
            db.add(role_perm)
    
    await db.commit()
    await db.refresh(new_role)
    
    await log_audit_action(db, "role_imported", admin_id, target_role_id=new_role.id)
    
    return new_role


# Analytics
@router.get("/analytics/staff-performance", response_model=dict)
async def get_staff_performance_analytics(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get staff performance analytics"""
    # Get all staff users with roles
    users_result = await db.execute(
        select(User)
        .join(UserRole)
        .distinct()
    )
    users = users_result.scalars().all()
    
    analytics = {
        "total_staff": len(users),
        "by_role": {},
        "performance_summary": {
            "total_chats": 0,
            "chats_ended": 0,
            "total_tickets": 0,
            "tickets_resolved": 0,
            "average_rating": 0.0,
            "total_ratings": 0
        }
    }
    
    for user in users:
        # Get user roles
        roles_result = await db.execute(
            select(StaffRole)
            .join(UserRole)
            .where(UserRole.user_id == user.id)
        )
        roles = roles_result.scalars().all()
        
        for role in roles:
            if role.name not in analytics["by_role"]:
                analytics["by_role"][role.name] = 0
            analytics["by_role"][role.name] += 1
        
        # Get performance metrics
        chats_result = await db.execute(
            select(func.count(ChatSession.id))
            .where(ChatSession.assigned_to == user.id)
        )
        total_chats = chats_result.scalar() or 0
        
        chats_ended_result = await db.execute(
            select(func.count(ChatSession.id))
            .where(
                and_(
                    ChatSession.assigned_to == user.id,
                    ChatSession.status.in_(["closed", "archived"])
                )
            )
        )
        chats_ended = chats_ended_result.scalar() or 0
        
        tickets_result = await db.execute(
            select(func.count(SupportTicket.id))
            .where(SupportTicket.assigned_to == user.id)
        )
        total_tickets = tickets_result.scalar() or 0
        
        tickets_resolved_result = await db.execute(
            select(func.count(SupportTicket.id))
            .where(
                and_(
                    SupportTicket.assigned_to == user.id,
                    SupportTicket.status == "resolved"
                )
            )
        )
        tickets_resolved = tickets_resolved_result.scalar() or 0
        
        ratings_result = await db.execute(
            select(func.avg(ChatSession.rating), func.count(ChatSession.rating))
            .where(
                and_(
                    ChatSession.assigned_to == user.id,
                    ChatSession.rating.isnot(None)
                )
            )
        )
        rating_data = ratings_result.first()
        avg_rating = rating_data[0] if rating_data[0] else 0.0
        rating_count = rating_data[1] or 0
        
        analytics["performance_summary"]["total_chats"] += total_chats
        analytics["performance_summary"]["chats_ended"] += chats_ended
        analytics["performance_summary"]["total_tickets"] += total_tickets
        analytics["performance_summary"]["tickets_resolved"] += tickets_resolved
        analytics["performance_summary"]["total_ratings"] += rating_count
        
        if rating_count > 0:
            analytics["performance_summary"]["average_rating"] = (
                (analytics["performance_summary"]["average_rating"] * (analytics["performance_summary"]["total_ratings"] - rating_count) + avg_rating * rating_count) /
                analytics["performance_summary"]["total_ratings"]
            )
    
    return analytics

