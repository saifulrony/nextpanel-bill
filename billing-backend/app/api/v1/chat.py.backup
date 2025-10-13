"""
Live Chat and AI Chatbot API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import ChatSession, ChatMessage, MessageSender, ChatSessionStatus, User
from app.schemas import (
    ChatSessionCreateRequest,
    ChatSessionResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatBotRequest,
    ChatBotResponse
)
from app.api.v1.events import broadcast_event
import logging
import secrets
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


# AI Bot Knowledge Base - Simple pattern matching for common questions
AI_RESPONSES = {
    "greeting": {
        "patterns": [r"hello", r"hi", r"hey", r"good morning", r"good afternoon", r"good evening"],
        "responses": [
            "Hello! 👋 Welcome to NextPanel Billing Support. How can I help you today?",
            "Hi there! I'm here to help you with any questions about our services.",
            "Hey! Thanks for reaching out. What can I assist you with?",
        ]
    },
    "pricing": {
        "patterns": [r"price", r"cost", r"pricing", r"how much", r"plan", r"subscription"],
        "responses": [
            "We offer various pricing plans to suit different needs. You can view all our plans at /shop. Would you like me to show you our most popular plans?",
            "Our pricing starts from as low as $9.99/month. We have different tiers based on your hosting needs. Want to see our detailed pricing?",
        ]
    },
    "features": {
        "patterns": [r"feature", r"what do you offer", r"capabilities", r"what can", r"services"],
        "responses": [
            "We offer comprehensive hosting solutions including domain management, licenses, billing, and support. What specific feature are you interested in?",
            "Our platform includes: \n• NextPanel License Management\n• Domain Registration\n• Automated Billing\n• 24/7 Support\n\nWhat would you like to know more about?",
        ]
    },
    "support": {
        "patterns": [r"help", r"support", r"problem", r"issue", r"not working", r"error"],
        "responses": [
            "I'm here to help! Can you tell me more about the issue you're experiencing?",
            "I'd be happy to assist you with that. Could you provide more details about the problem?",
        ]
    },
    "payment": {
        "patterns": [r"payment", r"pay", r"invoice", r"billing", r"charge"],
        "responses": [
            "For payment-related questions, I can help! We accept credit cards, PayPal, and other payment methods. What specific payment question do you have?",
            "Our billing system is automated and secure. You can view all your invoices in your dashboard. Need help with a specific payment?",
        ]
    },
    "domain": {
        "patterns": [r"domain", r"dns", r"nameserver", r"register domain"],
        "responses": [
            "We offer domain registration and management services. You can search for available domains and manage DNS settings in your dashboard. What domain would you like to register?",
            "Domain-related services include registration, transfer, and DNS management. How can I help with your domain needs?",
        ]
    },
    "license": {
        "patterns": [r"license", r"activation", r"license key", r"nextpanel"],
        "responses": [
            "NextPanel licenses are automatically generated when you purchase a plan. You can view and manage all your licenses in the Licenses section of your dashboard.",
            "Need help with your NextPanel license? I can assist with activation, renewal, or any license-related questions.",
        ]
    },
    "account": {
        "patterns": [r"account", r"sign up", r"register", r"login", r"password"],
        "responses": [
            "You can create an account by clicking 'Sign Up' at the top right. It's quick and easy! Need help with your existing account?",
            "For account-related issues, I'm here to help. Are you having trouble logging in or managing your account?",
        ]
    },
    "thanks": {
        "patterns": [r"thank", r"thanks", r"appreciate"],
        "responses": [
            "You're welcome! Is there anything else I can help you with?",
            "Happy to help! Let me know if you need anything else.",
        ]
    },
    "goodbye": {
        "patterns": [r"bye", r"goodbye", r"see you", r"thanks bye"],
        "responses": [
            "Goodbye! Feel free to reach out anytime you need assistance. Have a great day! 👋",
            "Thanks for chatting! If you need help in the future, I'm always here. Take care!",
        ]
    }
}

def get_ai_response(message: str) -> tuple[str, List[str]]:
    """Get AI bot response based on message content"""
    message_lower = message.lower()
    
    # Check each category
    for category, data in AI_RESPONSES.items():
        for pattern in data["patterns"]:
            if re.search(pattern, message_lower):
                import random
                response = random.choice(data["responses"])
                
                # Add suggestions based on category
                suggestions = []
                if category == "pricing":
                    suggestions = ["Show me all plans", "What's the cheapest plan?", "Tell me about features"]
                elif category == "support":
                    suggestions = ["I need technical help", "Billing question", "Talk to a human"]
                elif category == "greeting":
                    suggestions = ["View pricing plans", "How does it work?", "I have a question"]
                
                return (response, suggestions)
    
    # Default response if no pattern matches
    return (
        "I'm not sure I understand. Could you rephrase that? Or would you like to speak with a human agent? Common topics I can help with:\n• Pricing and Plans\n• Features and Services\n• Payment and Billing\n• Domain Management\n• License Activation",
        ["Talk to a human", "View pricing", "Contact sales"]
    )


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    request: ChatSessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = None
):
    """Create a new chat session (for logged-in users or guests)"""
    try:
        user_id = await get_current_user_id()
    except:
        user_id = None
    
    # Create session
    session = ChatSession(
        user_id=user_id,
        guest_email=request.guest_email,
        guest_name=request.guest_name,
        session_token=secrets.token_urlsafe(32) if not user_id else None,
        subject=request.subject,
        status=ChatSessionStatus.ACTIVE
    )
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # Send welcome message from bot
    welcome_message = ChatMessage(
        session_id=session.id,
        sender_type=MessageSender.BOT,
        message="Hello! 👋 I'm your AI assistant. How can I help you today?"
    )
    db.add(welcome_message)
    await db.commit()
    
    logger.info(f"Created chat session: {session.id}")
    
    return session


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[ChatSessionStatus] = None,
    limit: int = 50,
    offset: int = 0
):
    """List chat sessions (admin sees all, users see their own)"""
    # Make this work with or without authentication
    user_id = None
    is_admin = False
    
    try:
        from fastapi.security import HTTPBearer
        from fastapi import Request
        # Try to get authentication but don't fail if not provided
        user_id = await get_current_user_id()
        # Get user to check if admin
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        is_admin = user.is_admin if user else False
    except:
        # No authentication provided, continue as guest
        pass
    
    query = select(ChatSession)
    
    # Filter by user if not admin
    if not is_admin and user_id:
        query = query.where(ChatSession.user_id == user_id)
    
    # Apply status filter
    if status_filter:
        query = query.where(ChatSession.status == status_filter)
    
    query = query.order_by(ChatSession.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    # Add unread count for each session
    for session in sessions:
        unread_result = await db.execute(
            select(func.count(ChatMessage.id))
            .where(
                and_(
                    ChatMessage.session_id == session.id,
                    ChatMessage.is_read == False,
                    ChatMessage.sender_type != MessageSender.BOT
                )
            )
        )
        session.unread_count = unread_result.scalar() or 0
    
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get chat session details"""
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return session


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0
):
    """Get messages from a chat session"""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .offset(offset)
    )
    messages = result.scalars().all()
    
    # Add sender names
    for message in messages:
        if message.sender_id:
            user_result = await db.execute(
                select(User).where(User.id == message.sender_id)
            )
            user = user_result.scalars().first()
            message.sender_name = user.full_name if user else "Unknown"
        elif message.sender_type == MessageSender.BOT:
            message.sender_name = "AI Assistant"
        elif message.sender_type == MessageSender.SYSTEM:
            message.sender_name = "System"
        else:
            # Get from session
            session_result = await db.execute(
                select(ChatSession).where(ChatSession.id == session_id)
            )
            session = session_result.scalars().first()
            message.sender_name = session.guest_name if session and session.guest_name else "Guest"
    
    return messages


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    session_id: str,
    request: ChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    user_id: Optional[str] = None
):
    """Send a message in a chat session"""
    # Get session
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Try to get user ID
    try:
        user_id = await get_current_user_id()
        # Check if user is admin
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalars().first()
        sender_type = MessageSender.ADMIN if user and user.is_admin else MessageSender.USER
    except:
        user_id = None
        sender_type = MessageSender.USER
    
    # Create message
    message = ChatMessage(
        session_id=session_id,
        sender_type=sender_type,
        sender_id=user_id,
        message=request.message,
        message_metadata=request.metadata
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    # Broadcast real-time event
    await broadcast_event(session_id, "new_message", {
        "message_id": message.id,
        "sender_type": sender_type.value,
        "message": request.message
    })
    
    return message


@router.post("/bot", response_model=ChatBotResponse)
async def chat_with_bot(
    request: ChatBotRequest,
    db: AsyncSession = Depends(get_db)
):
    """Chat with AI bot - creates or continues a session"""
    # Get or create session
    session_id = request.session_id
    
    if not session_id:
        # For new sessions, require email and phone for guests
        if not request.guest_email or not request.guest_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and phone number are required to start a chat"
            )
        
        # Validate phone number format (basic validation)
        phone = request.guest_phone.strip()
        if len(phone) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a valid phone number"
            )
        
        # Create new session for bot chat
        session = ChatSession(
            guest_email=request.guest_email,
            guest_name=request.guest_name or "Guest",
            guest_phone=phone,
            session_token=secrets.token_urlsafe(32),
            subject="AI Chat",
            status=ChatSessionStatus.ACTIVE
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        session_id = session.id
    else:
        # Verify session exists
        result = await db.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
        session = result.scalars().first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Save user message
    user_message = ChatMessage(
        session_id=session_id,
        sender_type=MessageSender.USER,
        message=request.message
    )
    db.add(user_message)
    await db.commit()
    
    # Get AI response
    bot_reply, suggestions = get_ai_response(request.message)
    
    # Save bot response
    bot_message = ChatMessage(
        session_id=session_id,
        sender_type=MessageSender.BOT,
        message=bot_reply
    )
    db.add(bot_message)
    await db.commit()
    
    return ChatBotResponse(
        message=bot_reply,
        session_id=session_id,
        suggestions=suggestions,
        metadata={"timestamp": datetime.utcnow().isoformat()}
    )


@router.post("/sessions/{session_id}/close")
async def close_chat_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Close a chat session"""
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.status = ChatSessionStatus.CLOSED
    session.closed_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Chat session closed successfully"}


@router.post("/sessions/{session_id}/rate")
async def rate_chat_session(
    session_id: str,
    rating: int,
    feedback: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Rate a chat session"""
    if rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.rating = rating
    if feedback:
        session.feedback = feedback
    
    await db.commit()
    
    return {"message": "Thank you for your feedback!"}


@router.post("/sessions/{session_id}/assign")
async def assign_chat_to_admin(
    session_id: str,
    admin_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Assign chat session to an admin"""
    # Verify admin exists
    result = await db.execute(select(User).where(User.id == admin_id))
    admin = result.scalars().first()
    
    if not admin or not admin.is_admin:
        raise HTTPException(status_code=400, detail="Invalid admin ID")
    
    # Get session
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session.assigned_to = admin_id
    await db.commit()
    
    # Send system message
    system_message = ChatMessage(
        session_id=session_id,
        sender_type=MessageSender.SYSTEM,
        message=f"{admin.full_name} has joined the chat"
    )
    db.add(system_message)
    await db.commit()
    
    return {"message": "Chat assigned successfully"}


@router.get("/stats")
async def get_chat_stats(
    db: AsyncSession = Depends(get_db)
):
    """Get chat statistics (public endpoint)"""
    try:
        # Try to get user ID, but don't require it
        current_user_id = await get_current_user_id()
    except:
        current_user_id = None
    
    # Total sessions
    total_sessions = await db.execute(select(func.count(ChatSession.id)))
    
    # Active sessions
    active_sessions = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.status == ChatSessionStatus.ACTIVE)
    )
    
    # Average rating
    avg_rating = await db.execute(
        select(func.avg(ChatSession.rating)).where(ChatSession.rating.isnot(None))
    )
    
    # Total messages
    total_messages = await db.execute(select(func.count(ChatMessage.id)))
    
    return {
        "total_sessions": total_sessions.scalar() or 0,
        "active_sessions": active_sessions.scalar() or 0,
        "average_rating": round(avg_rating.scalar() or 0, 2),
        "total_messages": total_messages.scalar() or 0
    }

