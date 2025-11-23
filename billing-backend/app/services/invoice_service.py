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
        """Generate PDF from modal component HTML"""
        # Try to import weasyprint first
        try:
            from weasyprint import HTML
            from weasyprint.text.fonts import FontConfiguration
            weasyprint_available = True
        except ImportError:
            weasyprint_available = False
            logger.info("weasyprint not available, will use reportlab fallback")
        
        if weasyprint_available:
            try:
                # Get invoice data with safe date handling
                invoice_date = invoice.invoice_date if hasattr(invoice, 'invoice_date') and invoice.invoice_date else (invoice.created_at if hasattr(invoice, 'created_at') and invoice.created_at else datetime.utcnow())
                if not isinstance(invoice_date, datetime):
                    if isinstance(invoice_date, str):
                        try:
                            invoice_date = datetime.strptime(invoice_date, '%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            try:
                                invoice_date = datetime.strptime(invoice_date, '%Y-%m-%d')
                            except ValueError:
                                invoice_date = datetime.utcnow()
                    else:
                        invoice_date = datetime.utcnow()
                
                due_date = invoice.due_date if hasattr(invoice, 'due_date') and invoice.due_date else (invoice_date + timedelta(days=30))
                if not isinstance(due_date, datetime):
                    if isinstance(due_date, str):
                        try:
                            due_date = datetime.strptime(due_date, '%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            try:
                                due_date = datetime.strptime(due_date, '%Y-%m-%d')
                            except ValueError:
                                due_date = invoice_date + timedelta(days=30)
                    else:
                        due_date = invoice_date + timedelta(days=30)
                
                invoice_number = invoice.invoice_number if hasattr(invoice, 'invoice_number') and invoice.invoice_number else f"ORD-{str(invoice.id)[:8]}"
                
                # Status formatting with safe handling
                if hasattr(invoice, 'status'):
                    if hasattr(invoice.status, 'value'):
                        status = str(invoice.status.value).lower()
                    else:
                        status = str(invoice.status).lower()
                else:
                    status = 'pending'
                status_text = status.capitalize()
                status_bg_color = '#dcfce7' if status == 'paid' else '#fef3c7' if status == 'pending' else '#fee2e2'
                status_text_color = '#166534' if status == 'paid' else '#92400e' if status == 'pending' else '#991b1b'
                
                # Customer info with safe handling
                customer_name = 'Customer'
                if user:
                    if hasattr(user, 'full_name') and user.full_name:
                        customer_name = user.full_name
                    elif hasattr(user, 'email') and user.email:
                        customer_name = user.email.split('@')[0]
                
                customer_email = 'customer@example.com'
                if user and hasattr(user, 'email') and user.email:
                    customer_email = user.email
                
                # Payment method
                payment_method = ''
                if hasattr(invoice, 'payment_method') and invoice.payment_method:
                    payment_method = f'<p>Payment Method: {invoice.payment_method}</p>'
                
                # Get invoice totals with safe defaults
                subtotal = float(getattr(invoice, 'subtotal', 0) or 0)
                tax = float(getattr(invoice, 'tax', 0) or 0)
                total = float(getattr(invoice, 'total', 0) or 0)
                
                # If total is 0, calculate from items
                if total == 0 and subtotal == 0:
                    items_total = sum(
                        (item.get('unit_price') or item.get('price') or item.get('amount', 0)) * (item.get('quantity', 1))
                        for item in (invoice.items or [])
                    )
                    subtotal = items_total
                    total = subtotal + tax
                
                # Build items table rows
                items_rows = ''
                for item in (invoice.items or []):
                    if isinstance(item, dict):
                        unit_price = float(item.get('unit_price') or item.get('price') or item.get('amount', 0))
                        quantity = int(item.get('quantity', 1))
                        total_item = unit_price * quantity
                        description = item.get('description', item.get('product_name', 'Item'))
                    else:
                        # Handle object attributes
                        unit_price = float(getattr(item, 'unit_price', getattr(item, 'price', getattr(item, 'amount', 0))) or 0)
                        quantity = int(getattr(item, 'quantity', 1) or 1)
                        total_item = unit_price * quantity
                        description = getattr(item, 'description', getattr(item, 'product_name', 'Item'))
                    
                    items_rows += f'''
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{description}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quantity}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${unit_price:.2f}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${total_item:.2f}</td>
                </tr>
                '''
                
                # Create HTML matching the modal component exactly
                html_content = f'''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {{
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: white;
      padding: 20px;
    }}
    .invoice-container {{
      max-width: 1200px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      padding: 20px;
    }}
    .invoice-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }}
    .invoice-title {{
      font-size: 18px;
      font-weight: 500;
      color: #111827;
    }}
    .invoice-content {{
      margin-top: 20px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }}
    .bill-to h4, .invoice-details h4 {{
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      margin-bottom: 8px;
    }}
    .bill-to p, .invoice-details p {{
      font-size: 12px;
      color: #4b5563;
      margin-bottom: 4px;
    }}
    .status-badge {{
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      background-color: {status_bg_color};
      color: {status_text_color};
    }}
    .table-container {{
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      border-radius: 8px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
    }}
    thead {{
      background-color: #f9fafb;
    }}
    th {{
      padding: 12px 24px;
      text-align: left;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    tbody tr {{
      border-top: 1px solid #e5e7eb;
    }}
    tbody td {{
      padding: 16px 24px;
      font-size: 14px;
      color: #111827;
    }}
    tfoot {{
      background-color: #f9fafb;
    }}
    tfoot tr {{
      border-top: 1px solid #e5e7eb;
    }}
    tfoot td {{
      padding: 16px 24px;
      font-size: 14px;
      color: #111827;
    }}
    tfoot td:first-child {{
      text-align: right;
      font-weight: 500;
    }}
    tfoot tr:last-child td {{
      font-weight: 600;
    }}
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <h3 class="invoice-title">Invoice {invoice_number}</h3>
    </div>
    
    <div class="invoice-content">
      <div class="grid">
        <div class="bill-to">
          <h4>Bill To:</h4>
          <div>
            <p>{customer_name}</p>
            <p>{customer_email}</p>
            <p>Address not available</p>
          </div>
        </div>
        <div class="invoice-details">
          <h4>Invoice Details:</h4>
          <div>
            <p>Date: {invoice_date.strftime("%m/%d/%Y") if hasattr(invoice_date, 'strftime') else str(invoice_date)[:10]}</p>
            <p>Due: {due_date.strftime("%m/%d/%Y") if hasattr(due_date, 'strftime') else str(due_date)[:10]}</p>
            <p>Status: <span class="status-badge">{status_text}</span></p>
            {payment_method}
          </div>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items_rows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">Subtotal:</td>
              <td>${subtotal:.2f}</td>
            </tr>
            <tr>
              <td colspan="3">Tax:</td>
              <td>${tax:.2f}</td>
            </tr>
            <tr>
              <td colspan="3">Total:</td>
              <td>${total:.2f}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</body>
</html>
            '''
                
                # Convert HTML to PDF using WeasyPrint
                font_config = FontConfiguration()
                html_doc = HTML(string=html_content)
                pdf_bytes = html_doc.write_pdf(font_config=font_config)
                
                logger.info(f"Generated PDF from modal component HTML for invoice {invoice_number}")
                return pdf_bytes
            except Exception as e:
                logger.error(f"Error generating PDF with weasyprint: {e}", exc_info=True)
                logger.info("Falling back to reportlab PDF generation")
                # Fallback to reportlab on error
                try:
                    return await self._generate_pdf_fallback(invoice, user, company_info)
                except Exception as fallback_error:
                    logger.error(f"Fallback PDF generation also failed: {fallback_error}", exc_info=True)
                    logger.error(f"Fallback error type: {type(fallback_error).__name__}", exc_info=True)
                    raise Exception(f"PDF generation failed: {str(e)}. Fallback also failed: {str(fallback_error)}")
        else:
            # weasyprint not available, use fallback
            logger.info("Using reportlab fallback for PDF generation")
            try:
                return await self._generate_pdf_fallback(invoice, user, company_info)
            except Exception as e:
                logger.error(f"Critical error in PDF generation fallback: {e}", exc_info=True)
                raise Exception(f"PDF generation failed: {str(e)}")
    
    async def _generate_pdf_fallback(self, invoice: Any, user: Any, company_info: Optional[Dict] = None) -> bytes:
        """Fallback PDF generation using reportlab"""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.enums import TA_RIGHT
        except ImportError as e:
            logger.error(f"reportlab not available: {e}")
            raise Exception("PDF generation libraries not available. Please install reportlab.")
        
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36,
                                  topMargin=36, bottomMargin=36)
            
            elements = []
            styles = getSampleStyleSheet()
            
            # Handle date conversion
            if hasattr(invoice, 'invoice_date') and invoice.invoice_date:
                invoice_date = invoice.invoice_date
            elif hasattr(invoice, 'created_at') and invoice.created_at:
                invoice_date = invoice.created_at
            else:
                invoice_date = datetime.utcnow()
            
            # Ensure invoice_date is a datetime object
            if isinstance(invoice_date, str):
                try:
                    from dateutil import parser
                    invoice_date = parser.parse(invoice_date)
                except ImportError:
                    # Fallback to datetime.strptime for common formats
                    from datetime import datetime
                    try:
                        invoice_date = datetime.strptime(invoice_date, '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        try:
                            invoice_date = datetime.strptime(invoice_date, '%Y-%m-%d')
                        except ValueError:
                            invoice_date = datetime.utcnow()
            
            due_date = invoice.due_date if hasattr(invoice, 'due_date') and invoice.due_date else (invoice_date + timedelta(days=30))
            if isinstance(due_date, str):
                try:
                    from dateutil import parser
                    due_date = parser.parse(due_date)
                except ImportError:
                    # Fallback to datetime.strptime for common formats
                    from datetime import datetime
                    try:
                        due_date = datetime.strptime(due_date, '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        try:
                            due_date = datetime.strptime(due_date, '%Y-%m-%d')
                        except ValueError:
                            due_date = invoice_date + timedelta(days=30)
            
            invoice_number = invoice.invoice_number if hasattr(invoice, 'invoice_number') and invoice.invoice_number else f"ORD-{str(invoice.id)[:8]}"
            
            title_style = ParagraphStyle(
                'InvoiceTitle',
                parent=styles['Heading2'],
                fontSize=18,
                textColor=colors.HexColor('#111827'),
                fontName='Helvetica',
                spaceAfter=16
            )
            elements.append(Paragraph(f'Invoice {invoice_number}', title_style))
            elements.append(Spacer(1, 0.2*inch))
            
            # Two-column layout
            bill_to_style = ParagraphStyle(
                'BillToHeader',
                parent=styles['Normal'],
                fontSize=14,
                textColor=colors.HexColor('#111827'),
                fontName='Helvetica-Bold',
                spaceAfter=8
            )
            bill_to_content_style = ParagraphStyle(
                'BillToContent',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor('#4b5563'),
                fontName='Helvetica',
                spaceAfter=4
            )
            
            # Customer info with safe handling
            customer_name = 'Customer'
            if user:
                if hasattr(user, 'full_name') and user.full_name:
                    customer_name = user.full_name
                elif hasattr(user, 'email') and user.email:
                    customer_name = user.email.split('@')[0]
            
            customer_email = 'customer@example.com'
            if user and hasattr(user, 'email') and user.email:
                customer_email = user.email
            
            bill_to_data = [
                [Paragraph('Bill To:', bill_to_style), ''],
                [Paragraph(customer_name, bill_to_content_style), ''],
                [Paragraph(customer_email, bill_to_content_style), ''],
                [Paragraph('Address not available', bill_to_content_style), ''],
            ]
            
            invoice_details_style = ParagraphStyle(
                'InvoiceDetailsHeader',
                parent=styles['Normal'],
                fontSize=14,
                textColor=colors.HexColor('#111827'),
                fontName='Helvetica-Bold',
                spaceAfter=8
            )
            invoice_details_content_style = ParagraphStyle(
                'InvoiceDetailsContent',
                parent=styles['Normal'],
                fontSize=12,
                textColor=colors.HexColor('#4b5563'),
                fontName='Helvetica',
                spaceAfter=4
            )
            
            status = str(invoice.status).lower() if hasattr(invoice.status, 'value') else str(invoice.status).lower()
            status_text = status.capitalize()
            
            # Format dates safely
            try:
                date_str = invoice_date.strftime("%m/%d/%Y") if hasattr(invoice_date, 'strftime') else str(invoice_date)[:10]
            except:
                date_str = str(invoice_date)[:10] if invoice_date else "N/A"
            
            try:
                due_str = due_date.strftime("%m/%d/%Y") if hasattr(due_date, 'strftime') else str(due_date)[:10]
            except:
                due_str = str(due_date)[:10] if due_date else "N/A"
            
            invoice_details_data = [
                [Paragraph('Invoice Details:', invoice_details_style), ''],
                [Paragraph(f'Date: {date_str}', invoice_details_content_style), ''],
                [Paragraph(f'Due: {due_str}', invoice_details_content_style), ''],
                [Paragraph(f'Status: {status_text}', invoice_details_content_style), ''],
            ]
            
            if hasattr(invoice, 'payment_method') and invoice.payment_method:
                invoice_details_data.append([Paragraph(f'Payment Method: {invoice.payment_method}', invoice_details_content_style), ''])
            
            two_col_table = Table([
                [
                    Table(bill_to_data, colWidths=[3*inch]),
                    Table(invoice_details_data, colWidths=[3*inch])
                ]
            ], colWidths=[3.5*inch, 3.5*inch])
            two_col_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            elements.append(two_col_table)
            elements.append(Spacer(1, 0.3*inch))
            
            items_data = [['Description', 'Qty', 'Price', 'Total']]
            for item in (invoice.items or []):
                unit_price = item.get('unit_price') or item.get('price') or item.get('amount', 0)
                quantity = item.get('quantity', 1)
                total = unit_price * quantity
                items_data.append([
                    item.get('description', ''),
                    str(quantity),
                    f"${unit_price:.2f}",
                    f"${total:.2f}"
                ])
            
            items_data.append(['', '', '', ''])
            items_data.append([
                Paragraph(f'<para alignment="right">Subtotal:</para>', styles['Normal']),
                '',
                '',
                f"${invoice.subtotal:.2f}"
            ])
            items_data.append([
                Paragraph(f'<para alignment="right">Tax:</para>', styles['Normal']),
                '',
                '',
                f"${invoice.tax:.2f}"
            ])
            items_data.append([
                Paragraph(f'<para alignment="right"><b>Total:</b></para>', styles['Normal']),
                '',
                '',
                Paragraph(f'<b>${invoice.total:.2f}</b>', styles['Normal'])
            ])
            
            items_table = Table(items_data, colWidths=[3.5*inch, 0.8*inch, 1.2*inch, 1.2*inch])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f9fafb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#6b7280')),
                ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONT', (0, 1), (-1, -4), 'Helvetica', 10),
                ('FONTSIZE', (0, 1), (-1, -4), 10),
                ('TEXTCOLOR', (0, 1), (-1, -4), colors.HexColor('#111827')),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 1), (-1, -4), 16),
                ('BOTTOMPADDING', (0, 1), (-1, -4), 16),
                ('GRID', (0, 0), (-1, -4), 1, colors.HexColor('#e5e7eb')),
                ('BACKGROUND', (0, -3), (-1, -1), colors.HexColor('#f9fafb')),
                ('FONT', (0, -3), (-1, -2), 'Helvetica', 10),
                ('FONTSIZE', (0, -3), (-1, -2), 10),
                ('TEXTCOLOR', (0, -3), (-1, -2), colors.HexColor('#111827')),
                ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 10),
                ('FONTSIZE', (0, -1), (-1, -1), 10),
                ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#111827')),
                ('ALIGN', (0, -3), (-1, -1), 'RIGHT'),
                ('ALIGN', (3, -3), (-1, -1), 'LEFT'),
                ('TOPPADDING', (0, -3), (-1, -1), 16),
                ('BOTTOMPADDING', (0, -3), (-1, -1), 16),
                ('GRID', (0, -3), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ]))
            elements.append(items_table)
            
            doc.build(elements)
            pdf_content = buffer.getvalue()
            buffer.close()
            
            if not pdf_content or len(pdf_content) == 0:
                raise Exception("PDF generation returned empty content")
            
            logger.info(f"Generated PDF using reportlab fallback, size: {len(pdf_content)} bytes")
            return pdf_content
        except Exception as e:
            logger.error(f"Error in PDF fallback generation: {e}", exc_info=True)
            raise
    
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
