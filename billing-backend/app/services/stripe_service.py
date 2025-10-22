"""
Stripe Payment Service
Handles Stripe payment processing
"""
import stripe
import logging
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class StripeService:
    """Service for Stripe payment processing"""
    
    def __init__(self):
        if settings.STRIPE_SECRET_KEY:
            stripe.api_key = settings.STRIPE_SECRET_KEY
        else:
            logger.warning("Stripe secret key not configured")
    
    async def create_payment_intent(
        self,
        amount: float,
        currency: str = "usd",
        payment_method_id: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Create a Stripe payment intent"""
        try:
            if not settings.STRIPE_SECRET_KEY:
                return {
                    "success": False,
                    "error": "Stripe not configured"
                }
            
            intent_data = {
                "amount": int(amount * 100),  # Convert to cents
                "currency": currency.lower(),
                "metadata": metadata or {}
            }
            
            if payment_method_id:
                intent_data["payment_method"] = payment_method_id
                intent_data["confirm"] = True
            
            intent = stripe.PaymentIntent.create(**intent_data)
            
            return {
                "success": intent.status == "succeeded",
                "payment_intent_id": intent.id,
                "status": intent.status,
                "client_secret": intent.client_secret,
                "amount": intent.amount,
                "currency": intent.currency
            }
            
        except stripe.error.CardError as e:
            logger.error(f"Stripe card error: {str(e)}")
            return {
                "success": False,
                "error": f"Card error: {e.user_message}",
                "stripe_error": str(e)
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {str(e)}")
            return {
                "success": False,
                "error": f"Payment processing error: {str(e)}",
                "stripe_error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating payment intent: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    async def confirm_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a Stripe payment intent"""
        try:
            if not settings.STRIPE_SECRET_KEY:
                return {
                    "success": False,
                    "error": "Stripe not configured"
                }
            
            intent = stripe.PaymentIntent.confirm(payment_intent_id)
            
            return {
                "success": intent.status == "succeeded",
                "payment_intent_id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment intent: {str(e)}")
            return {
                "success": False,
                "error": f"Payment confirmation error: {str(e)}",
                "stripe_error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error confirming payment intent: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    async def retrieve_payment_intent(self, payment_intent_id: str) -> Dict[str, Any]:
        """Retrieve a Stripe payment intent"""
        try:
            if not settings.STRIPE_SECRET_KEY:
                return {
                    "success": False,
                    "error": "Stripe not configured"
                }
            
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            return {
                "success": True,
                "payment_intent_id": intent.id,
                "status": intent.status,
                "amount": intent.amount,
                "currency": intent.currency,
                "metadata": intent.metadata,
                "created": intent.created
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving payment intent: {str(e)}")
            return {
                "success": False,
                "error": f"Payment retrieval error: {str(e)}",
                "stripe_error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error retrieving payment intent: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    async def create_customer(self, email: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Create a Stripe customer"""
        try:
            if not settings.STRIPE_SECRET_KEY:
                return {
                    "success": False,
                    "error": "Stripe not configured"
                }
            
            customer_data = {
                "email": email
            }
            
            if name:
                customer_data["name"] = name
            
            customer = stripe.Customer.create(**customer_data)
            
            return {
                "success": True,
                "customer_id": customer.id,
                "email": customer.email,
                "name": customer.name
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating customer: {str(e)}")
            return {
                "success": False,
                "error": f"Customer creation error: {str(e)}",
                "stripe_error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating customer: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }
    
    async def list_payment_methods(self, customer_id: str) -> Dict[str, Any]:
        """List payment methods for a customer"""
        try:
            if not settings.STRIPE_SECRET_KEY:
                return {
                    "success": False,
                    "error": "Stripe not configured"
                }
            
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card"
            )
            
            return {
                "success": True,
                "payment_methods": [
                    {
                        "id": pm.id,
                        "type": pm.type,
                        "card": {
                            "brand": pm.card.brand,
                            "last4": pm.card.last4,
                            "exp_month": pm.card.exp_month,
                            "exp_year": pm.card.exp_year
                        } if pm.card else None
                    }
                    for pm in payment_methods.data
                ]
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error listing payment methods: {str(e)}")
            return {
                "success": False,
                "error": f"Payment methods retrieval error: {str(e)}",
                "stripe_error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error listing payment methods: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}"
            }