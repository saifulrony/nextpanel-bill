"""
Email Templates API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id, verify_admin
from app.models import EmailTemplate, EmailTemplateType, User
from app.schemas import BaseModel
from app.services.email_service import EmailService
from pydantic import Field, EmailStr
from typing import Dict, Any
import logging
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/email-templates", tags=["email-templates"])


# Schemas
class EmailTemplateCreateRequest(BaseModel):
    name: str = Field(..., max_length=255)
    template_type: EmailTemplateType
    subject: str = Field(..., max_length=500)
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    available_variables: Optional[str] = None


class EmailTemplateUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    subject: Optional[str] = Field(None, max_length=500)
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    available_variables: Optional[str] = None
    is_active: Optional[bool] = None


class EmailTemplateResponse(BaseModel):
    id: str
    name: str
    template_type: EmailTemplateType
    subject: str
    body_text: Optional[str]
    body_html: Optional[str]
    available_variables: Optional[str]
    is_active: bool
    is_system: bool
    created_at: datetime
    updated_at: Optional[datetime]


class RenderTemplateRequest(BaseModel):
    template_id: str
    variables: dict = Field(default_factory=dict)


@router.post("/", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_email_template(
    request: EmailTemplateCreateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create email template (admin only)"""
    # Extract variables from template
    variables = set()
    if request.body_html:
        variables.update(re.findall(r'\{\{(\w+)\}\}', request.body_html))
    if request.body_text:
        variables.update(re.findall(r'\{\{(\w+)\}\}', request.body_text))
    if request.subject:
        variables.update(re.findall(r'\{\{(\w+)\}\}', request.subject))
    
    available_variables = ",".join([f"{{{{{v}}}}}" for v in sorted(variables)])
    
    template = EmailTemplate(
        name=request.name,
        template_type=request.template_type,
        subject=request.subject,
        body_text=request.body_text,
        body_html=request.body_html,
        available_variables=available_variables,
        created_by=user_id,
        is_active=True,
        is_system=False
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    logger.info(f"Email template created: {template.name} by user {user_id}")
    return template


@router.get("/", response_model=List[EmailTemplateResponse])
async def list_email_templates(
    template_type: Optional[EmailTemplateType] = Query(None),
    search: Optional[str] = None,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """List email templates (admin only)"""
    query = select(EmailTemplate)
    
    if template_type:
        query = query.where(EmailTemplate.template_type == template_type)
    
    if search:
        query = query.where(
            or_(
                EmailTemplate.name.ilike(f"%{search}%"),
                EmailTemplate.subject.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(EmailTemplate.created_at.desc())
    
    result = await db.execute(query)
    templates = result.scalars().all()
    return templates


@router.get("/{template_id}", response_model=EmailTemplateResponse)
async def get_email_template(
    template_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get email template (admin only)"""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id))
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    
    return template


@router.put("/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(
    template_id: str,
    request: EmailTemplateUpdateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update email template (admin only)"""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id))
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    
    if template.is_system:
        raise HTTPException(status_code=400, detail="Cannot modify system templates")
    
    # Update fields
    if request.name is not None:
        template.name = request.name
    if request.subject is not None:
        template.subject = request.subject
    if request.body_text is not None:
        template.body_text = request.body_text
    if request.body_html is not None:
        template.body_html = request.body_html
        # Re-extract variables
        variables = set()
        if template.body_html:
            variables.update(re.findall(r'\{\{(\w+)\}\}', template.body_html))
        if template.body_text:
            variables.update(re.findall(r'\{\{(\w+)\}\}', template.body_text))
        if template.subject:
            variables.update(re.findall(r'\{\{(\w+)\}\}', template.subject))
        template.available_variables = ",".join([f"{{{{{v}}}}}" for v in sorted(variables)])
    if request.is_active is not None:
        template.is_active = request.is_active
    
    await db.commit()
    await db.refresh(template)
    
    logger.info(f"Email template updated: {template.name} by user {user_id}")
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_template(
    template_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete email template (admin only)"""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id))
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    
    if template.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system templates")
    
    await db.delete(template)
    await db.commit()
    
    logger.info(f"Email template deleted: {template.name} by user {user_id}")


@router.post("/{template_id}/render", response_model=dict)
async def render_email_template(
    template_id: str,
    request: RenderTemplateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Render email template with variables (admin only)"""
    result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == template_id))
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    
    # Render template
    def render_text(text: str, vars: dict) -> str:
        if not text:
            return ""
        result_text = text
        for key, value in vars.items():
            result_text = result_text.replace(f"{{{{{key}}}}}", str(value))
        return result_text
    
    rendered_subject = render_text(template.subject, request.variables)
    rendered_body_text = render_text(template.body_text, request.variables)
    rendered_body_html = render_text(template.body_html, request.variables)
    
    return {
        "subject": rendered_subject,
        "body_text": rendered_body_text,
        "body_html": rendered_body_html
    }


class SendEmailRequest(BaseModel):
    customer_id: str
    template_id: Optional[str] = None
    subject: Optional[str] = None  # Optional: required if template_id is not provided, can override template subject if provided
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    variables: Optional[Dict[str, Any]] = Field(default_factory=dict)


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_email_to_customer(
    request: SendEmailRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Send email to a customer using a template or custom content (admin only)"""
    # Validate: either template_id or subject must be provided
    if not request.template_id and not request.subject:
        raise HTTPException(
            status_code=400,
            detail="Either 'template_id' or 'subject' must be provided"
        )
    
    # Get customer
    result = await db.execute(select(User).where(User.id == request.customer_id))
    customer = result.scalars().first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    subject = request.subject
    body_text = request.body_text or ""
    body_html = request.body_html
    
    # If template_id is provided, render the template
    if request.template_id:
        result = await db.execute(select(EmailTemplate).where(EmailTemplate.id == request.template_id))
        template = result.scalars().first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Email template not found")
        
        # Prepare variables with customer data
        variables = {
            "customer_name": customer.full_name or "Customer",
            "customer_email": customer.email,
            "company_name": customer.company_name or "",
            **request.variables
        }
        
        # Render template
        def render_text(text: str, vars: dict) -> str:
            if not text:
                return ""
            result_text = text
            for key, value in vars.items():
                result_text = result_text.replace(f"{{{{{key}}}}}", str(value))
            return result_text
        
        # Use template subject, but allow request subject to override if provided
        template_subject = render_text(template.subject, variables)
        subject = request.subject if request.subject else template_subject
        body_text = render_text(template.body_text or "", variables)
        body_html = render_text(template.body_html or "", variables) if template.body_html else None
    
    # Send email
    email_service = EmailService()
    success = await email_service.send_email(
        to_email=customer.email,
        subject=subject,
        body=body_text,
        html_body=body_html
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    logger.info(f"Email sent to customer {customer.email} by admin {user_id}")
    return {
        "status": "success",
        "message": f"Email sent successfully to {customer.email}",
        "customer_email": customer.email
    }

