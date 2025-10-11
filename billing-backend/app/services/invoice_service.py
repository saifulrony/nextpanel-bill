"""
Invoice Service - Comprehensive invoice generation and management
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
import logging
from io import BytesIO

logger = logging.getLogger(__name__)


class InvoiceService:
    """Service for comprehensive invoice operations"""
    
    async def generate_invoice_number(self, db: AsyncSession) -> str:
        """Generate unique invoice number in format INV-YYYY-MM-XXXX"""
        from app.models import Invoice
        
        now = datetime.utcnow()
        year = now.year
        month = now.month
        
        # Count invoices this month
        result = await db.execute(
            select(func.count(Invoice.id))
            .where(
                func.extract('year', Invoice.created_at) == year,
                func.extract('month', Invoice.created_at) == month
            )
        )
        count = result.scalar() or 0
        
        invoice_number = f"INV-{year}-{month:02d}-{(count + 1):04d}"
        logger.info(f"Generated invoice number: {invoice_number}")
        return invoice_number
    
    async def calculate_invoice_totals(
        self,
        items: List[Dict[str, Any]],
        tax_rate: float = 0.0,
        discount_percent: float = 0.0,
        discount_amount: float = 0.0
    ) -> Dict[str, float]:
        """Calculate invoice totals with tax and discount"""
        # Calculate subtotal
        subtotal = sum(item.get('amount', 0) * item.get('quantity', 1) for item in items)
        
        # Apply percentage discount
        if discount_percent > 0:
            discount_amount = subtotal * (discount_percent / 100)
        
        # Calculate amount after discount
        amount_after_discount = subtotal - discount_amount
        
        # Calculate tax on discounted amount
        tax = amount_after_discount * (tax_rate / 100) if tax_rate else 0.0
        
        # Calculate total
        total = amount_after_discount + tax
        
        return {
            'subtotal': round(subtotal, 2),
            'discount_amount': round(discount_amount, 2),
            'discount_percent': discount_percent,
            'tax': round(tax, 2),
            'tax_rate': tax_rate,
            'total': round(total, 2),
            'amount_due': round(total, 2)
        }
    
    async def check_overdue_invoices(self, db: AsyncSession):
        """Check and update status of overdue invoices"""
        from app.models import Invoice, InvoiceStatus
        
        now = datetime.utcnow()
        
        # Find open invoices past due date
        result = await db.execute(
            select(Invoice).where(
                and_(
                    Invoice.status == InvoiceStatus.OPEN,
                    Invoice.due_date < now
                )
            )
        )
        overdue_invoices = result.scalars().all()
        
        for invoice in overdue_invoices:
            invoice.status = InvoiceStatus.OVERDUE
            logger.info(f"Marked invoice {invoice.invoice_number} as overdue")
        
        await db.commit()
        return len(overdue_invoices)
    
    async def generate_pdf(self, invoice: Any, user: Any, company_info: Optional[Dict] = None) -> bytes:
        """Generate professional PDF invoice"""
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
            from reportlab.lib.enums import TA_RIGHT, TA_CENTER
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                                  topMargin=72, bottomMargin=18)
            
            elements = []
            styles = getSampleStyleSheet()
            
            # Company header
            company_name = company_info.get('name', 'Your Company') if company_info else 'NextPanel Billing'
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1a56db'),
                spaceAfter=30
            )
            elements.append(Paragraph(company_name, title_style))
            
            # Company info
            if company_info:
                company_details = f"""
                {company_info.get('address', '')}<br/>
                {company_info.get('city', '')}, {company_info.get('state', '')} {company_info.get('zip', '')}<br/>
                Phone: {company_info.get('phone', '')}<br/>
                Email: {company_info.get('email', '')}
                """
                elements.append(Paragraph(company_details, styles['Normal']))
            
            elements.append(Spacer(1, 0.3*inch))
            
            # Invoice title
            invoice_title = ParagraphStyle(
                'InvoiceTitle',
                parent=styles['Heading2'],
                fontSize=20,
                textColor=colors.HexColor('#374151')
            )
            elements.append(Paragraph('INVOICE', invoice_title))
            elements.append(Spacer(1, 0.2*inch))
            
            # Invoice details table
            invoice_date = invoice.invoice_date or invoice.created_at
            due_date = invoice.due_date or (invoice_date + timedelta(days=30))
            
            invoice_info = [
                ['Invoice Number:', invoice.invoice_number],
                ['Invoice Date:', invoice_date.strftime('%B %d, %Y')],
                ['Due Date:', due_date.strftime('%B %d, %Y')],
                ['Status:', invoice.status.upper()],
            ]
            
            if invoice.customer_po_number:
                invoice_info.append(['PO Number:', invoice.customer_po_number])
            
            invoice_table = Table(invoice_info, colWidths=[2*inch, 3*inch])
            invoice_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
                ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 10),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(invoice_table)
            elements.append(Spacer(1, 0.3*inch))
            
            # Bill to section
            bill_to_style = ParagraphStyle(
                'BillTo',
                parent=styles['Heading3'],
                fontSize=12,
                textColor=colors.HexColor('#374151')
            )
            elements.append(Paragraph('Bill To:', bill_to_style))
            elements.append(Spacer(1, 0.1*inch))
            
            customer_info = f"""
            <b>{user.full_name}</b><br/>
            {user.company_name or ''}<br/>
            {user.email}
            """
            elements.append(Paragraph(customer_info, styles['Normal']))
            elements.append(Spacer(1, 0.3*inch))
            
            # Line items table
            items_data = [['Description', 'Qty', 'Unit Price', 'Amount']]
            for item in (invoice.items or []):
                unit_price = item.get('unit_price') or item.get('amount', 0)
                quantity = item.get('quantity', 1)
                total = unit_price * quantity
                items_data.append([
                    item.get('description', ''),
                    str(quantity),
                    f"${unit_price:.2f}",
                    f"${total:.2f}"
                ])
            
            items_table = Table(items_data, colWidths=[3.5*inch, 0.8*inch, 1.2*inch, 1.2*inch])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 11),
                ('FONT', (0, 1), (-1, -1), 'Helvetica', 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ]))
            elements.append(items_table)
            elements.append(Spacer(1, 0.2*inch))
            
            # Totals
            totals_data = [
                ['Subtotal:', f"${invoice.subtotal:.2f}"],
            ]
            
            if invoice.discount_amount > 0:
                discount_label = f'Discount ({invoice.discount_percent}%):' if invoice.discount_percent else 'Discount:'
                totals_data.append([discount_label, f"-${invoice.discount_amount:.2f}"])
            
            if invoice.tax > 0:
                tax_label = f'Tax ({invoice.tax_rate}%):' if invoice.tax_rate else 'Tax:'
                totals_data.append([tax_label, f"${invoice.tax:.2f}"])
            
            totals_data.append(['Total:', f"${invoice.total:.2f}"])
            
            if invoice.amount_paid > 0:
                totals_data.append(['Amount Paid:', f"-${invoice.amount_paid:.2f}"])
                totals_data.append(['Amount Due:', f"${invoice.amount_due:.2f}"])
            
            totals_table = Table(totals_data, colWidths=[5.3*inch, 1.4*inch])
            totals_table.setStyle(TableStyle([
                ('FONT', (0, 0), (-1, -2), 'Helvetica', 10),
                ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 12),
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#374151')),
            ]))
            elements.append(totals_table)
            
            # Notes and terms
            if invoice.notes or invoice.terms:
                elements.append(Spacer(1, 0.4*inch))
                
                if invoice.notes:
                    elements.append(Paragraph('<b>Notes:</b>', styles['Normal']))
                    elements.append(Spacer(1, 0.1*inch))
                    elements.append(Paragraph(invoice.notes, styles['Normal']))
                    elements.append(Spacer(1, 0.2*inch))
                
                if invoice.terms:
                    elements.append(Paragraph('<b>Terms and Conditions:</b>', styles['Normal']))
                    elements.append(Spacer(1, 0.1*inch))
                    elements.append(Paragraph(invoice.terms, styles['Normal']))
            
            # Payment instructions
            if invoice.payment_instructions:
                elements.append(Spacer(1, 0.3*inch))
                elements.append(Paragraph('<b>Payment Instructions:</b>', styles['Normal']))
                elements.append(Spacer(1, 0.1*inch))
                elements.append(Paragraph(invoice.payment_instructions, styles['Normal']))
            
            # Build PDF
            doc.build(elements)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            logger.info(f"Generated professional PDF for invoice {invoice.invoice_number}")
            return pdf_content
            
        except ImportError:
            logger.warning("reportlab not installed, generating simple text PDF")
            # Fallback to simple text-based PDF
            return await self._generate_simple_pdf(invoice, user)
    
    async def _generate_simple_pdf(self, invoice: Any, user: Any) -> bytes:
        """Generate simple text-based invoice (fallback)"""
        pdf_content = f"""
        ╔════════════════════════════════════════════════════════╗
        ║                      INVOICE                           ║
        ╚════════════════════════════════════════════════════════╝
        
        Invoice Number: {invoice.invoice_number}
        Invoice Date: {(invoice.invoice_date or invoice.created_at).strftime('%Y-%m-%d')}
        Due Date: {invoice.due_date.strftime('%Y-%m-%d') if invoice.due_date else 'N/A'}
        Status: {invoice.status.upper()}
        
        ─────────────────────────────────────────────────────────
        BILL TO:
        {user.full_name}
        {user.company_name or ''}
        {user.email}
        ─────────────────────────────────────────────────────────
        
        LINE ITEMS:
        """
        
        for item in (invoice.items or []):
            unit_price = item.get('unit_price') or item.get('amount', 0)
            quantity = item.get('quantity', 1)
            total = unit_price * quantity
            pdf_content += f"\n{item.get('description')} x{quantity} @ ${unit_price:.2f} = ${total:.2f}"
        
        pdf_content += f"""
        
        ─────────────────────────────────────────────────────────
        Subtotal:                                    ${invoice.subtotal:.2f}
        """
        
        if invoice.discount_amount > 0:
            pdf_content += f"Discount ({invoice.discount_percent}%):                        -${invoice.discount_amount:.2f}\n"
        
        if invoice.tax > 0:
            pdf_content += f"Tax ({invoice.tax_rate}%):                                 ${invoice.tax:.2f}\n"
        
        pdf_content += f"""
        ─────────────────────────────────────────────────────────
        TOTAL:                                       ${invoice.total:.2f}
        """
        
        if invoice.amount_paid > 0:
            pdf_content += f"\nAmount Paid:                                 -${invoice.amount_paid:.2f}"
            pdf_content += f"\nAmount Due:                                   ${invoice.amount_due:.2f}"
        
        if invoice.notes:
            pdf_content += f"\n\n─────────────────────────────────────────────────────────\nNotes:\n{invoice.notes}"
        
        if invoice.terms:
            pdf_content += f"\n\n─────────────────────────────────────────────────────────\nTerms:\n{invoice.terms}"
        
        if invoice.payment_instructions:
            pdf_content += f"\n\n─────────────────────────────────────────────────────────\nPayment Instructions:\n{invoice.payment_instructions}"
        
        pdf_content += "\n\n        Thank you for your business!"
        
        return pdf_content.encode('utf-8')
    
    async def send_invoice_email(self, invoice: Any, user: Any, db: AsyncSession):
        """Send invoice via email with PDF attachment"""
        from app.services.email_service import EmailService
        
        try:
            email_service = EmailService()
            
            # Generate PDF
            pdf_content = await self.generate_pdf(invoice, user)
            
            # Email subject and body
            subject = f"Invoice {invoice.invoice_number} from NextPanel"
            
            due_date_str = invoice.due_date.strftime('%B %d, %Y') if invoice.due_date else 'Upon receipt'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #1a56db;">Invoice {invoice.invoice_number}</h2>
                    
                    <p>Dear {user.full_name},</p>
                    
                    <p>Please find attached your invoice for <strong>${invoice.total:.2f} {invoice.currency}</strong>.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <table style="width: 100%;">
                            <tr>
                                <td><strong>Invoice Number:</strong></td>
                                <td>{invoice.invoice_number}</td>
                            </tr>
                            <tr>
                                <td><strong>Invoice Date:</strong></td>
                                <td>{(invoice.invoice_date or invoice.created_at).strftime('%B %d, %Y')}</td>
                            </tr>
                            <tr>
                                <td><strong>Due Date:</strong></td>
                                <td>{due_date_str}</td>
                            </tr>
                            <tr>
                                <td><strong>Amount Due:</strong></td>
                                <td style="font-size: 18px; color: #1a56db;"><strong>${invoice.amount_due:.2f}</strong></td>
                            </tr>
                        </table>
                    </div>
                    
                    <p>You can view and pay this invoice by logging into your account.</p>
                    
                    {f'<p><strong>Payment Instructions:</strong><br/>{invoice.payment_instructions}</p>' if invoice.payment_instructions else ''}
                    
                    <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
                    
                    <p>Thank you for your business!</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;"/>
                    <p style="font-size: 12px; color: #6b7280;">
                        This is an automated email. Please do not reply directly to this message.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # Send email with attachment
            await email_service.send_email_with_attachment(
                to_email=user.email,
                subject=subject,
                body=body,
                attachment_content=pdf_content,
                attachment_filename=f"invoice-{invoice.invoice_number}.pdf"
            )
            
            # Update invoice
            invoice.sent_to_customer = True
            await db.commit()
            
            logger.info(f"Invoice {invoice.invoice_number} sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send invoice email: {str(e)}")
            return False
    
    async def send_payment_reminder(self, invoice: Any, user: Any, db: AsyncSession):
        """Send payment reminder for overdue/upcoming invoice"""
        from app.services.email_service import EmailService
        
        try:
            email_service = EmailService()
            
            # Determine reminder type
            if invoice.status == 'overdue':
                subject = f"Payment Reminder: Invoice {invoice.invoice_number} is Overdue"
                urgency = "overdue"
            else:
                subject = f"Payment Reminder: Invoice {invoice.invoice_number} Due Soon"
                urgency = "upcoming"
            
            due_date_str = invoice.due_date.strftime('%B %d, %Y') if invoice.due_date else 'immediately'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: {'#dc2626' if urgency == 'overdue' else '#f59e0b'};">Payment Reminder</h2>
                    
                    <p>Dear {user.full_name},</p>
                    
                    <p>This is a friendly reminder that invoice <strong>{invoice.invoice_number}</strong> for 
                    <strong>${invoice.amount_due:.2f}</strong> is {'overdue' if urgency == 'overdue' else 'due soon'}.</p>
                    
                    <div style="background-color: {'#fef2f2' if urgency == 'overdue' else '#fef3c7'}; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid {'#dc2626' if urgency == 'overdue' else '#f59e0b'};">
                        <table style="width: 100%;">
                            <tr>
                                <td><strong>Invoice Number:</strong></td>
                                <td>{invoice.invoice_number}</td>
                            </tr>
                            <tr>
                                <td><strong>Due Date:</strong></td>
                                <td>{due_date_str}</td>
                            </tr>
                            <tr>
                                <td><strong>Amount Due:</strong></td>
                                <td style="font-size: 18px; font-weight: bold;">${invoice.amount_due:.2f}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p>Please log in to your account to make a payment or download your invoice.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background-color: #1a56db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Pay Now</a>
                    </div>
                    
                    <p>If you have already made this payment, please disregard this reminder.</p>
                    
                    <p>If you have any questions, please contact us.</p>
                    
                    <p>Thank you,<br/>NextPanel Billing Team</p>
                </div>
            </body>
            </html>
            """
            
            await email_service.send_email(
                to_email=user.email,
                subject=subject,
                body=body
            )
            
            # Update reminder tracking
            invoice.last_reminder_sent = datetime.utcnow()
            invoice.reminder_count += 1
            await db.commit()
            
            logger.info(f"Payment reminder sent for invoice {invoice.invoice_number}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment reminder: {str(e)}")
            return False
    
    async def process_partial_payment(
        self,
        invoice: Any,
        amount: float,
        payment_method: str,
        notes: Optional[str],
        db: AsyncSession
    ):
        """Process a partial payment for an invoice"""
        from app.models import PartialPayment, InvoiceStatus
        
        # Create partial payment record
        partial_payment = PartialPayment(
            invoice_id=invoice.id,
            amount=amount,
            payment_method=payment_method,
            notes=notes
        )
        db.add(partial_payment)
        
        # Update invoice amounts
        invoice.amount_paid += amount
        invoice.amount_due = invoice.total - invoice.amount_paid
        
        # Update status
        if invoice.amount_due <= 0:
            invoice.status = InvoiceStatus.PAID
            invoice.paid_at = datetime.utcnow()
        else:
            invoice.status = InvoiceStatus.PARTIALLY_PAID
        
        await db.commit()
        
        logger.info(f"Processed partial payment of ${amount} for invoice {invoice.invoice_number}")
        return partial_payment
    
    async def generate_recurring_invoice(
        self,
        parent_invoice: Any,
        db: AsyncSession
    ):
        """Generate a new invoice from a recurring invoice"""
        from app.models import Invoice, InvoiceStatus
        
        # Generate new invoice number
        invoice_number = await self.generate_invoice_number(db)
        
        # Calculate new due date
        if parent_invoice.recurring_interval == 'monthly':
            due_date = datetime.utcnow() + timedelta(days=30)
        elif parent_invoice.recurring_interval == 'quarterly':
            due_date = datetime.utcnow() + timedelta(days=90)
        elif parent_invoice.recurring_interval == 'yearly':
            due_date = datetime.utcnow() + timedelta(days=365)
        else:
            due_date = datetime.utcnow() + timedelta(days=30)
        
        # Create new invoice
        new_invoice = Invoice(
            user_id=parent_invoice.user_id,
            subscription_id=parent_invoice.subscription_id,
            license_id=parent_invoice.license_id,
            invoice_number=invoice_number,
            status=InvoiceStatus.OPEN,
            subtotal=parent_invoice.subtotal,
            discount_amount=parent_invoice.discount_amount,
            discount_percent=parent_invoice.discount_percent,
            tax=parent_invoice.tax,
            tax_rate=parent_invoice.tax_rate,
            total=parent_invoice.total,
            amount_due=parent_invoice.total,
            currency=parent_invoice.currency,
            due_date=due_date,
            items=parent_invoice.items,
            notes=parent_invoice.notes,
            terms=parent_invoice.terms,
            payment_instructions=parent_invoice.payment_instructions,
            is_recurring=True,
            recurring_interval=parent_invoice.recurring_interval,
            recurring_parent_id=parent_invoice.id
        )
        
        db.add(new_invoice)
        await db.commit()
        await db.refresh(new_invoice)
        
        logger.info(f"Generated recurring invoice {new_invoice.invoice_number} from {parent_invoice.invoice_number}")
        return new_invoice
    
    async def get_aging_report(self, db: AsyncSession) -> Dict[str, Any]:
        """Generate accounts receivable aging report"""
        from app.models import Invoice, InvoiceStatus
        
        now = datetime.utcnow()
        
        # Current (not yet due)
        result = await db.execute(
            select(func.sum(Invoice.amount_due))
            .where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date >= now
                )
            )
        )
        current = result.scalar() or 0.0
        
        # 1-30 days overdue
        result = await db.execute(
            select(func.sum(Invoice.amount_due))
            .where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date < now,
                    Invoice.due_date >= now - timedelta(days=30)
                )
            )
        )
        days_1_30 = result.scalar() or 0.0
        
        # 31-60 days overdue
        result = await db.execute(
            select(func.sum(Invoice.amount_due))
            .where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date < now - timedelta(days=30),
                    Invoice.due_date >= now - timedelta(days=60)
                )
            )
        )
        days_31_60 = result.scalar() or 0.0
        
        # 61-90 days overdue
        result = await db.execute(
            select(func.sum(Invoice.amount_due))
            .where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date < now - timedelta(days=60),
                    Invoice.due_date >= now - timedelta(days=90)
                )
            )
        )
        days_61_90 = result.scalar() or 0.0
        
        # 90+ days overdue
        result = await db.execute(
            select(func.sum(Invoice.amount_due))
            .where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date < now - timedelta(days=90)
                )
            )
        )
        days_90_plus = result.scalar() or 0.0
        
        total_outstanding = current + days_1_30 + days_31_60 + days_61_90 + days_90_plus
        
        return {
            'current': round(current, 2),
            '1_30_days': round(days_1_30, 2),
            '31_60_days': round(days_31_60, 2),
            '61_90_days': round(days_61_90, 2),
            '90_plus_days': round(days_90_plus, 2),
            'total_outstanding': round(total_outstanding, 2),
            'generated_at': now.isoformat()
        }
