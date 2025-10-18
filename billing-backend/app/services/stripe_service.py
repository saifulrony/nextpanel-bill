"""
Stripe Payment Service
"""
import logging
from typing import Dict, Any, Optional
import stripe
from app.core.config import settings

logger = logging.getLogger(__name__)

class StripeService:
    """Service for Stripe payment processing"""
    
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
    
    async def create_payment_intent(
        self, 
        amount: int, 
        currency: str = "usd",
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a payment intent"""
        try:
            intent_data = {
                "amount": amount,
                "currency": currency,
                "automatic_payment_methods": {
                    "enabled": True,
                }
            }
            
            if customer_id:
                intent_data["customer"] = customer_id
            
            if metadata:
                intent_data["metadata"] = metadata
            
            payment_intent = stripe.PaymentIntent.create(**intent_data)
            
            return {
                "id": payment_intent.id,
                "client_secret": payment_intent.client_secret,
                "status": payment_intent.status
            }
            
        except Exception as e:
            logger.error(f"Failed to create payment intent: {str(e)}")
            raise
    
    async def create_checkout_session(
        self,
        payment_intent_id: str,
        success_url: str,
        cancel_url: str,
        line_items: list
    ) -> Dict[str, Any]:
        """Create a Stripe checkout session"""
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                payment_intent_data={
                    "id": payment_intent_id
                }
            )
            
            return {
                "id": session.id,
                "url": session.url
            }
            
        except Exception as e:
            logger.error(f"Failed to create checkout session: {str(e)}")
            raise
    
    async def handle_webhook(self, request: Any) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            payload = await request.body()
            sig_header = request.headers.get('stripe-signature')
            
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            
            return event
            
        except Exception as e:
            logger.error(f"Webhook processing failed: {str(e)}")
            raise
