"""
Security utilities: JWT, password hashing, etc.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
import base64
import json
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db

# HTTP Bearer for JWT
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_token(token: str) -> Optional[str]:
    """
    Verify token and return user_id (for SSE/query param auth)
    Returns user_id or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Get current user ID from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    return user_id


async def get_customer_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Get current customer user ID from JWT token (same as admin auth)"""
    token = credentials.credentials
    print(f"=== CUSTOMER AUTH DEBUG ===")
    print(f"Received token: {token[:50]}...")
    print(f"Token length: {len(token)}")
    
    try:
        # Use the same JWT decoding as admin authentication
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        
        if user_id is None:
            print("No user_id in JWT token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        
        print(f"JWT decode successful, user_id: {user_id}")
        print(f"=== END CUSTOMER AUTH DEBUG ===")
        return user_id
        
    except JWTError as jwt_error:
        print(f"JWT decode failed: {jwt_error}")
        print(f"=== END CUSTOMER AUTH DEBUG ===")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )


async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Require admin user and return user ID"""
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.core.database import get_db
    from app.models import User
    from sqlalchemy import select
    
    token = credentials.credentials
    payload = decode_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    # Check if user is admin
    # Note: This is a simplified check - in production, you might want to
    # implement role-based access control (RBAC) more thoroughly
    is_admin = payload.get("is_admin", False)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    return user_id


# Alias for backward compatibility
verify_admin = require_admin


async def check_permission(
    permission_name: str,
    user_id: str,
    db: AsyncSession
) -> bool:
    """
    Check if a user has a specific permission.
    Returns True if user has permission, False otherwise.
    """
    from app.models import User, StaffRole, StaffPermission, StaffRolePermission, UserRole, UserPermissionOverride
    from sqlalchemy import select, and_, or_
    from datetime import datetime
    
    # Get user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    
    if not user:
        return False
    
    # Super admins have all permissions
    if user.is_admin:
        return True
    
    # Check for permission override (explicit allow/deny)
    override_result = await db.execute(
        select(UserPermissionOverride)
        .where(
            and_(
                UserPermissionOverride.user_id == user_id,
                UserPermissionOverride.permission_id == (
                    select(StaffPermission.id)
                    .where(StaffPermission.name == permission_name)
                    .scalar_subquery()
                ),
                or_(
                    UserPermissionOverride.expires_at.is_(None),
                    UserPermissionOverride.expires_at > datetime.utcnow()
                )
            )
        )
        .order_by(UserPermissionOverride.created_at.desc())
        .limit(1)
    )
    override = override_result.scalars().first()
    if override:
        return override.is_allowed
    
    # Check permissions through roles
    # Get all active roles for user
    roles_result = await db.execute(
        select(StaffRole)
        .join(UserRole)
        .where(
            and_(
                UserRole.user_id == user_id,
                StaffRole.is_active == True,
                or_(
                    UserRole.expires_at.is_(None),
                    UserRole.expires_at > datetime.utcnow()
                )
            )
        )
    )
    roles = roles_result.scalars().all()
    
    if not roles:
        return False
    
    # Get permission
    perm_result = await db.execute(
        select(StaffPermission).where(StaffPermission.name == permission_name)
    )
    permission = perm_result.scalars().first()
    
    if not permission:
        return False
    
    # Check if any role has this permission (including inherited from parent roles)
    for role in roles:
        # Check direct permissions
        perm_check = await db.execute(
            select(StaffRolePermission)
            .where(
                and_(
                    StaffRolePermission.role_id == role.id,
                    StaffRolePermission.permission_id == permission.id
                )
            )
        )
        if perm_check.scalars().first():
            return True
        
        # Check inherited permissions from parent roles
        if role.parent_role_id:
            parent_role_result = await db.execute(
                select(StaffRole).where(StaffRole.id == role.parent_role_id)
            )
            parent_role = parent_role_result.scalars().first()
            
            # Recursively check parent roles
            if parent_role:
                parent_perm_check = await db.execute(
                    select(StaffRolePermission)
                    .where(
                        and_(
                            StaffRolePermission.role_id == parent_role.id,
                            StaffRolePermission.permission_id == permission.id
                        )
                    )
                )
                if parent_perm_check.scalars().first():
                    return True
    
    return False


def require_permission(permission_name: str):
    """
    Dependency factory to require a specific permission.
    Usage: require_permission("access_orders_page")
    """
    async def _require_permission(
        user_id: str = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db)
    ) -> str:
        has_permission = await check_permission(permission_name, user_id, db)
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission_name}",
            )
        
        return user_id
    
    return _require_permission


async def get_user_permissions(
    user_id: str,
    db: AsyncSession
) -> list[str]:
    """
    Get all permissions for a user (from roles and overrides).
    Returns list of permission names.
    """
    from app.models import User, StaffRole, StaffPermission, StaffRolePermission, UserRole, UserPermissionOverride
    from sqlalchemy import select, and_, or_
    from datetime import datetime
    
    permissions = set()
    
    # Get user
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    
    if not user:
        return []
    
    # Super admins have all permissions
    if user.is_admin:
        all_perms_result = await db.execute(select(StaffPermission))
        all_perms = all_perms_result.scalars().all()
        return [perm.name for perm in all_perms]
    
    # Get permissions from roles
    roles_result = await db.execute(
        select(StaffRole)
        .join(UserRole)
        .where(
            and_(
                UserRole.user_id == user_id,
                StaffRole.is_active == True,
                or_(
                    UserRole.expires_at.is_(None),
                    UserRole.expires_at > datetime.utcnow()
                )
            )
        )
    )
    roles = roles_result.scalars().all()
    
    for role in roles:
        perms_result = await db.execute(
            select(StaffPermission)
            .join(StaffRolePermission)
            .where(StaffRolePermission.role_id == role.id)
        )
        role_perms = perms_result.scalars().all()
        for perm in role_perms:
            permissions.add(perm.name)
    
    # Apply overrides
    overrides_result = await db.execute(
        select(UserPermissionOverride)
        .join(StaffPermission)
        .where(
            and_(
                UserPermissionOverride.user_id == user_id,
                or_(
                    UserPermissionOverride.expires_at.is_(None),
                    UserPermissionOverride.expires_at > datetime.utcnow()
                )
            )
        )
    )
    overrides = overrides_result.scalars().all()
    
    for override in overrides:
        if override.is_allowed:
            permissions.add(override.permission.name)
        else:
            permissions.discard(override.permission.name)
    
    return list(permissions)

