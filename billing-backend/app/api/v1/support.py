"""
Support Ticket System API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import SupportTicket, TicketReply, User, TicketStatus, TicketPriority
from app.schemas import (
    TicketCreateRequest,
    TicketResponse,
    TicketReplyRequest,
    TicketReplyResponse,
    TicketUpdateRequest
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/support", tags=["support"])


async def generate_ticket_number(db: AsyncSession) -> str:
    """Generate unique ticket number"""
    from sqlalchemy import func
    
    # Count tickets today
    today = datetime.utcnow().date()
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(func.date(SupportTicket.created_at) == today)
    )
    count = result.scalar() or 0
    
    # Format: TKT-YYYYMMDD-XXXX
    ticket_number = f"TKT-{today.strftime('%Y%m%d')}-{(count + 1):04d}"
    return ticket_number


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    request: TicketCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new support ticket"""
    # Generate ticket number
    ticket_number = await generate_ticket_number(db)
    
    # Create ticket
    ticket = SupportTicket(
        user_id=user_id,
        ticket_number=ticket_number,
        subject=request.subject,
        description=request.description,
        status=TicketStatus.OPEN,
        priority=TicketPriority(request.priority) if request.priority else TicketPriority.MEDIUM,
        category=request.category
    )
    
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    
    logger.info(f"Support ticket created: {ticket.ticket_number} by user {user_id}")
    
    # TODO: Send notification to support team
    
    return ticket


@router.get("/tickets", response_model=List[TicketResponse])
async def list_tickets(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    status_filter: str = None,
    limit: int = 50,
    offset: int = 0
):
    """List user's support tickets"""
    query = select(SupportTicket).where(SupportTicket.user_id == user_id)
    
    if status_filter:
        query = query.where(SupportTicket.status == status_filter)
    
    query = query.order_by(SupportTicket.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    tickets = result.scalars().all()
    
    return tickets


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get ticket details"""
    result = await db.execute(
        select(SupportTicket).where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == user_id
            )
        )
    )
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return ticket


@router.put("/tickets/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: str,
    request: TicketUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update ticket (user can only update their own tickets)"""
    result = await db.execute(
        select(SupportTicket).where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == user_id
            )
        )
    )
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Only allow updating certain fields
    if request.priority is not None:
        ticket.priority = TicketPriority(request.priority)
    
    await db.commit()
    await db.refresh(ticket)
    
    return ticket


@router.post("/tickets/{ticket_id}/replies", response_model=TicketReplyResponse, status_code=status.HTTP_201_CREATED)
async def add_ticket_reply(
    ticket_id: str,
    request: TicketReplyRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Add a reply to a ticket"""
    # Verify ticket exists and user has access
    result = await db.execute(
        select(SupportTicket).where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == user_id
            )
        )
    )
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check if user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    is_staff = user.is_admin if user else False
    
    # Create reply
    reply = TicketReply(
        ticket_id=ticket_id,
        user_id=user_id,
        message=request.message,
        is_staff=is_staff
    )
    
    db.add(reply)
    
    # Update ticket status if customer replied
    if not is_staff and ticket.status == TicketStatus.WAITING_FOR_CUSTOMER:
        ticket.status = TicketStatus.OPEN
    
    # Update ticket timestamp
    ticket.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(reply)
    
    logger.info(f"Reply added to ticket {ticket.ticket_number} by user {user_id}")
    
    return reply


@router.get("/tickets/{ticket_id}/replies", response_model=List[TicketReplyResponse])
async def list_ticket_replies(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List all replies for a ticket"""
    # Verify ticket access
    result = await db.execute(
        select(SupportTicket).where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == user_id
            )
        )
    )
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get replies
    result = await db.execute(
        select(TicketReply)
        .where(TicketReply.ticket_id == ticket_id)
        .order_by(TicketReply.created_at.asc())
    )
    replies = result.scalars().all()
    
    return replies


@router.post("/tickets/{ticket_id}/close", response_model=TicketResponse)
async def close_ticket(
    ticket_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Close a support ticket"""
    result = await db.execute(
        select(SupportTicket).where(
            and_(
                SupportTicket.id == ticket_id,
                SupportTicket.user_id == user_id
            )
        )
    )
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = TicketStatus.CLOSED
    ticket.resolved_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(ticket)
    
    logger.info(f"Ticket closed: {ticket.ticket_number}")
    
    return ticket


@router.get("/stats")
async def get_support_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's support ticket statistics"""
    from sqlalchemy import func
    
    # Total tickets
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(SupportTicket.user_id == user_id)
    )
    total_tickets = result.scalar() or 0
    
    # Tickets by status
    result = await db.execute(
        select(SupportTicket.status, func.count(SupportTicket.id))
        .where(SupportTicket.user_id == user_id)
        .group_by(SupportTicket.status)
    )
    
    by_status = {}
    for row in result:
        by_status[row[0].value] = row[1]
    
    # Open tickets
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(
            and_(
                SupportTicket.user_id == user_id,
                SupportTicket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
            )
        )
    )
    open_tickets = result.scalar() or 0
    
    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "by_status": by_status
    }


# Admin endpoints
async def verify_admin(user_id: str, db: AsyncSession):
    """Verify user is admin"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user_id


@router.get("/admin/tickets", response_model=List[TicketResponse])
async def admin_list_all_tickets(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    status_filter: str = None,
    priority_filter: str = None,
    limit: int = 50,
    offset: int = 0
):
    """List all support tickets (admin only)"""
    await verify_admin(user_id, db)
    
    query = select(SupportTicket)
    
    if status_filter:
        query = query.where(SupportTicket.status == status_filter)
    
    if priority_filter:
        query = query.where(SupportTicket.priority == priority_filter)
    
    query = query.order_by(SupportTicket.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    tickets = result.scalars().all()
    
    return tickets


@router.put("/admin/tickets/{ticket_id}/assign")
async def admin_assign_ticket(
    ticket_id: str,
    admin_user_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Assign ticket to admin (admin only)"""
    await verify_admin(user_id, db)
    
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.assigned_to = admin_user_id
    ticket.status = TicketStatus.IN_PROGRESS
    
    await db.commit()
    await db.refresh(ticket)
    
    logger.info(f"Ticket {ticket.ticket_number} assigned to admin {admin_user_id}")
    
    return ticket


@router.put("/admin/tickets/{ticket_id}/status")
async def admin_update_ticket_status(
    ticket_id: str,
    new_status: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update ticket status (admin only)"""
    await verify_admin(user_id, db)
    
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalars().first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    try:
        ticket.status = TicketStatus(new_status)
        
        if new_status in ["resolved", "closed"]:
            ticket.resolved_at = datetime.utcnow()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {new_status}"
        )
    
    await db.commit()
    await db.refresh(ticket)
    
    logger.info(f"Ticket {ticket.ticket_number} status updated to {new_status}")
    
    return ticket


@router.get("/admin/stats")
async def get_admin_support_stats(
    period: str = "month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive support ticket statistics for admin analytics"""
    await verify_admin(user_id, db)
    
    # Calculate date range based on period
    now = datetime.utcnow()
    
    if period == "today":
        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = now
    elif period == "yesterday":
        yesterday = now - timedelta(days=1)
        period_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "week":
        period_start = now - timedelta(days=7)
        period_end = now
    elif period == "month":
        period_start = now - timedelta(days=30)
        period_end = now
    elif period == "year":
        period_start = now - timedelta(days=365)
        period_end = now
    elif period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="start_date and end_date required for custom period")
        try:
            if 'T' in start_date:
                period_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                period_start = datetime.fromisoformat(f"{start_date}T00:00:00+00:00")
            
            if 'T' in end_date:
                period_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                period_end = datetime.fromisoformat(f"{end_date}T23:59:59+00:00")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    else:
        period_start = now - timedelta(days=30)
        period_end = now
    
    # Total tickets in period
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(SupportTicket.created_at.between(period_start, period_end))
    )
    total_tickets = result.scalar() or 0
    
    # Tickets by status
    result = await db.execute(
        select(SupportTicket.status, func.count(SupportTicket.id))
        .where(SupportTicket.created_at.between(period_start, period_end))
        .group_by(SupportTicket.status)
    )
    by_status = {}
    for row in result:
        by_status[row[0].value] = row[1]
    
    # Open tickets (OPEN + IN_PROGRESS)
    open_tickets = by_status.get('open', 0) + by_status.get('in_progress', 0)
    
    # Resolved tickets
    resolved_tickets = by_status.get('resolved', 0) + by_status.get('closed', 0)
    
    # Pending tickets
    pending_tickets = by_status.get('waiting_for_customer', 0)
    
    # Tickets by priority
    result = await db.execute(
        select(SupportTicket.priority, func.count(SupportTicket.id))
        .where(SupportTicket.created_at.between(period_start, period_end))
        .group_by(SupportTicket.priority)
    )
    by_priority = {}
    for row in result:
        by_priority[row[0].value] = row[1]
    
    high_priority = by_priority.get('high', 0)
    medium_priority = by_priority.get('medium', 0)
    low_priority = by_priority.get('low', 0)
    
    # Calculate average response time (simplified - time from ticket creation to first staff reply)
    # Get first staff reply for each ticket
    subquery = (
        select(
            TicketReply.ticket_id,
            func.min(TicketReply.created_at).label('first_reply')
        )
        .where(TicketReply.is_staff == True)
        .group_by(TicketReply.ticket_id)
        .subquery()
    )
    
    result = await db.execute(
        select(
            func.avg(
                func.extract('epoch', subquery.c.first_reply - SupportTicket.created_at) / 3600
            )
        )
        .select_from(SupportTicket)
        .join(subquery, subquery.c.ticket_id == SupportTicket.id)
        .where(SupportTicket.created_at.between(period_start, period_end))
    )
    avg_response_time = result.scalar() or 0.0
    
    # Calculate average resolution time
    result = await db.execute(
        select(
            func.avg(
                func.extract('epoch', SupportTicket.resolved_at - SupportTicket.created_at) / 3600
            )
        )
        .where(
            and_(
                SupportTicket.created_at.between(period_start, period_end),
                SupportTicket.resolved_at.isnot(None)
            )
        )
    )
    avg_resolution_time = result.scalar() or 0.0
    
    # Tickets this month
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(SupportTicket.created_at >= first_day_of_month)
    )
    tickets_this_month = result.scalar() or 0
    
    # Tickets this week
    week_ago = now - timedelta(days=7)
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(SupportTicket.created_at >= week_ago)
    )
    tickets_this_week = result.scalar() or 0
    
    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "pending_tickets": pending_tickets,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "avg_response_time": round(avg_response_time, 1),
        "avg_resolution_time": round(avg_resolution_time, 1),
        "tickets_this_month": tickets_this_month,
        "tickets_this_week": tickets_this_week,
        "customer_satisfaction": 4.2,  # Placeholder - would need rating system
    }


@router.get("/admin/stats")
async def get_admin_support_stats(
    period: str = "month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive support ticket statistics for admin analytics"""
    await verify_admin(user_id, db)
    
    # Calculate date range based on period
    now = datetime.utcnow()
    
    if period == "today":
        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = now
    elif period == "yesterday":
        yesterday = now - timedelta(days=1)
        period_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "week":
        period_start = now - timedelta(days=7)
        period_end = now
    elif period == "month":
        period_start = now - timedelta(days=30)
        period_end = now
    elif period == "year":
        period_start = now - timedelta(days=365)
        period_end = now
    elif period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="start_date and end_date required for custom period")
        try:
            if 'T' in start_date:
                period_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                period_start = datetime.fromisoformat(f"{start_date}T00:00:00+00:00")
            
            if 'T' in end_date:
                period_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                period_end = datetime.fromisoformat(f"{end_date}T23:59:59+00:00")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    else:
        period_start = now - timedelta(days=30)
        period_end = now
    
    # Total tickets in period
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(SupportTicket.created_at.between(period_start, period_end))
    )
    total_tickets = result.scalar() or 0
    
    # Tickets by status
    result = await db.execute(
        select(SupportTicket.status, func.count(SupportTicket.id))
        .where(SupportTicket.created_at.between(period_start, period_end))
        .group_by(SupportTicket.status)
    )
    by_status = {}
    for row in result:
        by_status[row[0].value] = row[1]
    
    # Open tickets (OPEN + IN_PROGRESS)
    open_tickets = by_status.get('open', 0) + by_status.get('in_progress', 0)
    
    # Resolved tickets
    resolved_tickets = by_status.get('resolved', 0) + by_status.get('closed', 0)
    
    # Pending tickets
    pending_tickets = by_status.get('waiting_for_customer', 0)
    
    # Tickets by priority
    result = await db.execute(
        select(SupportTicket.priority, func.count(SupportTicket.id))
        .where(SupportTicket.created_at.between(period_start, period_end))
        .group_by(SupportTicket.priority)
    )
    by_priority = {}
    for row in result:
        by_priority[row[0].value] = row[1]
    
    high_priority = by_priority.get('high', 0)
    medium_priority = by_priority.get('medium', 0)
    low_priority = by_priority.get('low', 0)
    
    # Calculate average response time (time from ticket creation to first staff reply)
    # Get first staff reply for each ticket
    from sqlalchemy import distinct
    subquery = (
        select(
            TicketReply.ticket_id,
            func.min(TicketReply.created_at).label('first_reply_time')
        )
        .where(TicketReply.is_staff == True)
        .group_by(TicketReply.ticket_id)
    ).subquery()
    
    result = await db.execute(
        select(
            func.avg(
                func.extract('epoch', subquery.c.first_reply_time - SupportTicket.created_at) / 3600
            )
        )
        .select_from(SupportTicket)
        .join(subquery, subquery.c.ticket_id == SupportTicket.id)
        .where(SupportTicket.created_at.between(period_start, period_end))
    )
    avg_response_time = result.scalar() or 0.0
    
    # Calculate average resolution time
    result = await db.execute(
        select(
            func.avg(
                func.extract('epoch', SupportTicket.resolved_at - SupportTicket.created_at) / 3600
            )
        )
        .where(
            and_(
                SupportTicket.created_at.between(period_start, period_end),
                SupportTicket.resolved_at.isnot(None)
            )
        )
    )
    avg_resolution_time = result.scalar() or 0.0
    
    # Tickets this month
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(SupportTicket.created_at >= first_day_of_month)
    )
    tickets_this_month = result.scalar() or 0
    
    # Tickets this week
    week_ago = now - timedelta(days=7)
    result = await db.execute(
        select(func.count(SupportTicket.id))
        .where(SupportTicket.created_at >= week_ago)
    )
    tickets_this_week = result.scalar() or 0
    
    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "resolved_tickets": resolved_tickets,
        "pending_tickets": pending_tickets,
        "high_priority": high_priority,
        "medium_priority": medium_priority,
        "low_priority": low_priority,
        "avg_response_time": round(avg_response_time, 1),
        "avg_resolution_time": round(avg_resolution_time, 1),
        "tickets_this_month": tickets_this_month,
        "tickets_this_week": tickets_this_week,
        "customer_satisfaction": 4.2,  # Placeholder - would need rating system
    }

