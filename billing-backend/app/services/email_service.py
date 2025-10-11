"""
Email Service - Handles email notifications
Integrates with email providers (SendGrid, AWS SES, SMTP)
"""
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self, provider: str = "smtp"):
        self.provider = provider
        self.from_email = "noreply@nextpanel.com"
        self.company_name = "NextPanel"
        logger.info(f"Initialized EmailService with provider: {provider}")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """Send an email"""
        # TODO: Integrate with actual email provider
        # For now, log the email
        
        logger.info(f"Sending email to {to_email}: {subject}")
        logger.debug(f"Email body: {body[:100]}...")
        
        # Mock email output for development
        print(f"\n{'='*60}")
        print(f"EMAIL SENT")
        print(f"{'='*60}")
        print(f"To: {to_email}")
        print(f"From: {self.from_email}")
        print(f"Subject: {subject}")
        print(f"{'='*60}")
        if html_body:
            print("HTML Body (preview):")
            print(html_body[:300] + "..." if len(html_body) > 300 else html_body)
        else:
            print(f"Body:\n{body[:300]}" + ("..." if len(body) > 300 else ""))
        print(f"{'='*60}\n")
        
        return True
    
    async def send_email_with_attachment(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachment_content: bytes,
        attachment_filename: str
    ) -> bool:
        """Send an email with attachment"""
        # TODO: Integrate with actual email provider
        # For now, log the email
        
        logger.info(f"Sending email with attachment to {to_email}: {subject}")
        logger.debug(f"Attachment: {attachment_filename} ({len(attachment_content)} bytes)")
        
        # Mock email output for development
        print(f"\n{'='*60}")
        print(f"EMAIL WITH ATTACHMENT SENT")
        print(f"{'='*60}")
        print(f"To: {to_email}")
        print(f"From: {self.from_email}")
        print(f"Subject: {subject}")
        print(f"Attachment: {attachment_filename} ({len(attachment_content)} bytes)")
        print(f"{'='*60}")
        print("HTML Body (preview):")
        print(body[:300] + "..." if len(body) > 300 else body)
        print(f"{'='*60}\n")
        
        return True
    
    async def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """Send welcome email to new user"""
        subject = f"Welcome to {self.company_name}!"
        
        body = f"""
        Hello {user_name},
        
        Welcome to {self.company_name}! We're excited to have you on board.
        
        Your account has been successfully created. You can now:
        - Purchase and manage licenses
        - Register and manage domains
        - Track your usage and billing
        - Access our comprehensive dashboard
        
        If you have any questions, feel free to contact our support team.
        
        Best regards,
        The {self.company_name} Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>Welcome to {self.company_name}!</h2>
                <p>Hello {user_name},</p>
                <p>We're excited to have you on board.</p>
                <p>Your account has been successfully created. You can now:</p>
                <ul>
                    <li>Purchase and manage licenses</li>
                    <li>Register and manage domains</li>
                    <li>Track your usage and billing</li>
                    <li>Access our comprehensive dashboard</li>
                </ul>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Best regards,<br>The {self.company_name} Team</p>
            </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_payment_receipt(
        self,
        user_email: str,
        user_name: str,
        payment_id: str,
        amount: float,
        currency: str,
        description: str
    ) -> bool:
        """Send payment receipt email"""
        subject = f"Payment Receipt - ${amount:.2f}"
        
        body = f"""
        Hello {user_name},
        
        Thank you for your payment!
        
        Payment Details:
        - Amount: ${amount:.2f} {currency}
        - Payment ID: {payment_id}
        - Description: {description}
        - Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
        
        This email serves as your receipt for this transaction.
        
        Best regards,
        The {self.company_name} Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>Payment Receipt</h2>
                <p>Hello {user_name},</p>
                <p>Thank you for your payment!</p>
                <h3>Payment Details:</h3>
                <ul>
                    <li><strong>Amount:</strong> ${amount:.2f} {currency}</li>
                    <li><strong>Payment ID:</strong> {payment_id}</li>
                    <li><strong>Description:</strong> {description}</li>
                    <li><strong>Date:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</li>
                </ul>
                <p>This email serves as your receipt for this transaction.</p>
                <p>Best regards,<br>The {self.company_name} Team</p>
            </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_license_expiry_reminder(
        self,
        user_email: str,
        user_name: str,
        license_key: str,
        expiry_date: datetime,
        days_until_expiry: int
    ) -> bool:
        """Send license expiry reminder"""
        subject = f"License Expiring in {days_until_expiry} Days"
        
        body = f"""
        Hello {user_name},
        
        Your license is expiring soon!
        
        License Details:
        - License Key: {license_key}
        - Expiry Date: {expiry_date.strftime('%Y-%m-%d')}
        - Days Until Expiry: {days_until_expiry}
        
        To avoid service interruption, please renew your license before it expires.
        
        Login to your account to renew: https://billing.nextpanel.com/licenses
        
        Best regards,
        The {self.company_name} Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>License Expiring Soon</h2>
                <p>Hello {user_name},</p>
                <p><strong>Your license is expiring in {days_until_expiry} days!</strong></p>
                <h3>License Details:</h3>
                <ul>
                    <li><strong>License Key:</strong> {license_key}</li>
                    <li><strong>Expiry Date:</strong> {expiry_date.strftime('%Y-%m-%d')}</li>
                </ul>
                <p>To avoid service interruption, please renew your license before it expires.</p>
                <p><a href="https://billing.nextpanel.com/licenses">Renew Now</a></p>
                <p>Best regards,<br>The {self.company_name} Team</p>
            </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_domain_expiry_reminder(
        self,
        user_email: str,
        user_name: str,
        domain_name: str,
        expiry_date: datetime,
        days_until_expiry: int
    ) -> bool:
        """Send domain expiry reminder"""
        subject = f"Domain {domain_name} Expiring in {days_until_expiry} Days"
        
        body = f"""
        Hello {user_name},
        
        Your domain registration is expiring soon!
        
        Domain Details:
        - Domain: {domain_name}
        - Expiry Date: {expiry_date.strftime('%Y-%m-%d')}
        - Days Until Expiry: {days_until_expiry}
        
        To keep your domain, please renew it before it expires.
        
        Login to your account to renew: https://billing.nextpanel.com/domains
        
        Best regards,
        The {self.company_name} Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>Domain Expiring Soon</h2>
                <p>Hello {user_name},</p>
                <p><strong>Your domain {domain_name} is expiring in {days_until_expiry} days!</strong></p>
                <h3>Domain Details:</h3>
                <ul>
                    <li><strong>Domain:</strong> {domain_name}</li>
                    <li><strong>Expiry Date:</strong> {expiry_date.strftime('%Y-%m-%d')}</li>
                </ul>
                <p>To keep your domain, please renew it before it expires.</p>
                <p><a href="https://billing.nextpanel.com/domains">Renew Now</a></p>
                <p>Best regards,<br>The {self.company_name} Team</p>
            </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_invoice_created(
        self,
        user_email: str,
        user_name: str,
        invoice_number: str,
        amount: float,
        due_date: datetime
    ) -> bool:
        """Send new invoice notification"""
        subject = f"New Invoice {invoice_number}"
        
        body = f"""
        Hello {user_name},
        
        A new invoice has been generated for your account.
        
        Invoice Details:
        - Invoice Number: {invoice_number}
        - Amount: ${amount:.2f}
        - Due Date: {due_date.strftime('%Y-%m-%d')}
        
        Please login to your account to view and pay the invoice.
        
        Best regards,
        The {self.company_name} Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>New Invoice</h2>
                <p>Hello {user_name},</p>
                <p>A new invoice has been generated for your account.</p>
                <h3>Invoice Details:</h3>
                <ul>
                    <li><strong>Invoice Number:</strong> {invoice_number}</li>
                    <li><strong>Amount:</strong> ${amount:.2f}</li>
                    <li><strong>Due Date:</strong> {due_date.strftime('%Y-%m-%d')}</li>
                </ul>
                <p><a href="https://billing.nextpanel.com/invoices">View Invoice</a></p>
                <p>Best regards,<br>The {self.company_name} Team</p>
            </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_subscription_cancelled(
        self,
        user_email: str,
        user_name: str,
        subscription_id: str,
        end_date: datetime
    ) -> bool:
        """Send subscription cancellation confirmation"""
        subject = "Subscription Cancelled"
        
        body = f"""
        Hello {user_name},
        
        Your subscription has been cancelled as requested.
        
        Your service will remain active until: {end_date.strftime('%Y-%m-%d')}
        
        If you change your mind, you can reactivate your subscription anytime before the end date.
        
        We're sorry to see you go!
        
        Best regards,
        The {self.company_name} Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>Subscription Cancelled</h2>
                <p>Hello {user_name},</p>
                <p>Your subscription has been cancelled as requested.</p>
                <p><strong>Your service will remain active until: {end_date.strftime('%Y-%m-%d')}</strong></p>
                <p>If you change your mind, you can reactivate your subscription anytime before the end date.</p>
                <p>We're sorry to see you go!</p>
                <p>Best regards,<br>The {self.company_name} Team</p>
            </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_quota_alert(
        self,
        user_email: str,
        user_name: str,
        resource_type: str,
        current_usage: int,
        max_quota: int,
        usage_percent: float
    ) -> bool:
        """Send quota usage alert"""
        subject = f"Quota Alert: {resource_type.title()} at {usage_percent:.0f}%"
        
        body = f"""
        Hello {user_name},
        
        You're approaching your quota limit for {resource_type}.
        
        Current Usage: {current_usage} / {max_quota} ({usage_percent:.1f}%)
        
        Consider upgrading your plan to get more resources.
        
        Best regards,
        The {self.company_name} Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>Quota Usage Alert</h2>
                <p>Hello {user_name},</p>
                <p><strong>You're approaching your quota limit for {resource_type}.</strong></p>
                <p>Current Usage: {current_usage} / {max_quota} ({usage_percent:.1f}%)</p>
                <p>Consider upgrading your plan to get more resources.</p>
                <p><a href="https://billing.nextpanel.com/plans">View Plans</a></p>
                <p>Best regards,<br>The {self.company_name} Team</p>
            </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)

