"""
Server-Sent Events (SSE) endpoint for real-time updates
"""
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_token
import asyncio
import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/events", tags=["events"])

# Store active connections with event queues
active_connections = {}
event_queues = {}

@router.get("/stream")
async def event_stream(
    request: Request,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Server-Sent Events stream for real-time updates
    Sends events when:
    - New order is created
    - Order status changes
    - Payment received
    """
    
    async def event_generator():
        # Verify token from query parameter inside the generator
        try:
            user_id = verify_token(token) if token else None
            if not user_id:
                logger.warning("SSE connection attempt without valid token")
                yield "data: {\"type\": \"error\", \"message\": \"Invalid token\"}\n\n"
                return
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            yield "data: {\"type\": \"error\", \"message\": \"Authentication failed\"}\n\n"
            return
        
        try:
            # Create event queue for this user
            event_queue = asyncio.Queue()
            event_queues[user_id] = event_queue
            active_connections[user_id] = True
            
            logger.info(f"SSE connection established for user {user_id}")
            
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Connected to real-time updates', 'user_id': user_id})}\n\n"
            
            # Keep connection alive and send events
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info(f"Client disconnected: {user_id}")
                    break
                
                try:
                    # Wait for events with timeout
                    event_data = await asyncio.wait_for(event_queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event_data)}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat every 30 seconds if no events
                    yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                
        except asyncio.CancelledError:
            logger.info(f"SSE connection cancelled for user {user_id}")
        except Exception as e:
            logger.error(f"SSE error for user {user_id}: {e}")
        finally:
            # Remove connection when closed
            if user_id in active_connections:
                del active_connections[user_id]
            if user_id in event_queues:
                del event_queues[user_id]
            logger.info(f"SSE connection closed for user {user_id}")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )


async def broadcast_event(user_id: str, event_type: str, data: dict):
    """
    Broadcast an event to a specific user
    Called when important events happen (new order, payment, etc.)
    """
    if user_id in event_queues:
        event_data = {
            "type": event_type,
            "data": data,
            "timestamp": asyncio.get_event_loop().time()
        }
        try:
            await event_queues[user_id].put(event_data)
            logger.info(f"Broadcasted {event_type} event to user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to broadcast event to user {user_id}: {e}")
            return False
    else:
        logger.debug(f"User {user_id} not connected, event not sent")
        return False

