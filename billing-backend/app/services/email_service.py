"""
Email Service - Handles email notifications
Integrates with email providers (SendGrid, AWS SES, SMTP)
"""
from typing import Dict, Any, List, Optional
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
import os
from app.core.config import settings

# Try to import aiosmtplib, but make it optional
try:
    import aiosmtplib
    AIOSMTPLIB_AVAILABLE = True
except ImportError:
    AIOSMTPLIB_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("aiosmtplib not available. Email sending will be logged only. Install with: pip install aiosmtplib")

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self, provider: str = "smtp"):
        self.provider = provider
        self.from_email = os.getenv("EMAIL_FROM", settings.EMAIL_FROM)
        self.company_name = "NextPanel"
        self.smtp_host = os.getenv("SMTP_HOST", settings.SMTP_HOST)
        self.smtp_port = int(os.getenv("SMTP_PORT", str(settings.SMTP_PORT)))
        self.smtp_user = os.getenv("SMTP_USER", settings.SMTP_USER)
        self.smtp_password = os.getenv("SMTP_PASSWORD", settings.SMTP_PASSWORD)
        logger.info(f"Initialized EmailService with provider: {provider}, host: {self.smtp_host}:{self.smtp_port}")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """Send an email via SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text and HTML parts
            part1 = MIMEText(body, 'plain')
            msg.attach(part1)
            
            if html_body:
                part2 = MIMEText(html_body, 'html')
                msg.attach(part2)
            
            # Send email
            if self.smtp_user and self.smtp_password and AIOSMTPLIB_AVAILABLE:
                # Use authenticated SMTP
                await aiosmtplib.send(
                    msg,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_user,
                    password=self.smtp_password,
                    use_tls=self.smtp_port == 587,
                    start_tls=self.smtp_port == 587
                )
                logger.info(f"Email sent successfully to {to_email}: {subject}")
                return True
            else:
                # Development mode - just log
                logger.warning(f"SMTP credentials not configured. Email would be sent to {to_email}: {subject}")
                print(f"\n{'='*60}")
                print(f"EMAIL (SMTP not configured)")
                print(f"{'='*60}")
                print(f"To: {to_email}")
                print(f"From: {self.from_email}")
                print(f"Subject: {subject}")
                print(f"{'='*60}\n")
                return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}", exc_info=True)
            # In development, still return True to not break workflows
            if settings.DEBUG:
                print(f"\n{'='*60}")
                print(f"EMAIL ERROR (would send in production)")
                print(f"{'='*60}")
                print(f"To: {to_email}")
                print(f"Error: {str(e)}")
                print(f"{'='*60}\n")
                return True
            return False
    
    async def send_email_with_attachment(
        self,
        to_email: str,
        subject: str,
        body: str,
        attachment_content: bytes,
        attachment_filename: str
    ) -> bool:
        """Send an email with attachment via SMTP"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body
            msg.attach(MIMEText(body, 'html'))
            
            # Add attachment
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment_content)
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {attachment_filename}'
            )
            msg.attach(part)
            
            # Send email
            if self.smtp_user and self.smtp_password and AIOSMTPLIB_AVAILABLE:
                await aiosmtplib.send(
                    msg,
                    hostname=self.smtp_host,
                    port=self.smtp_port,
                    username=self.smtp_user,
                    password=self.smtp_password,
                    use_tls=self.smtp_port == 587,
                    start_tls=self.smtp_port == 587
                )
                logger.info(f"Email with attachment sent successfully to {to_email}: {subject}")
                return True
            else:
                logger.warning(f"SMTP credentials not configured. Email with attachment would be sent to {to_email}: {subject}")
                print(f"\n{'='*60}")
                print(f"EMAIL WITH ATTACHMENT (SMTP not configured)")
                print(f"{'='*60}")
                print(f"To: {to_email}")
                print(f"Attachment: {attachment_filename} ({len(attachment_content)} bytes)")
                print(f"{'='*60}\n")
                return True
        except Exception as e:
            logger.error(f"Failed to send email with attachment to {to_email}: {str(e)}", exc_info=True)
            if settings.DEBUG:
                print(f"\n{'='*60}")
                print(f"EMAIL ERROR (would send in production)")
                print(f"Error: {str(e)}")
                print(f"{'='*60}\n")
                return True
            return False
    
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

