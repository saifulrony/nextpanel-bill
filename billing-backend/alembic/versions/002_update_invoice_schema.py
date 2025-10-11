"""Update invoice schema with comprehensive features

Revision ID: 002
Revises: 001
Create Date: 2025-10-10 08:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to invoices table
    with op.batch_alter_table('invoices', schema=None) as batch_op:
        # Add subscription and license references
        batch_op.add_column(sa.Column('subscription_id', sa.String(36), nullable=True))
        batch_op.add_column(sa.Column('license_id', sa.String(36), nullable=True))
        
        # Add discount fields
        batch_op.add_column(sa.Column('discount_amount', sa.Float(), nullable=False, server_default='0.0'))
        batch_op.add_column(sa.Column('discount_percent', sa.Float(), nullable=False, server_default='0.0'))
        batch_op.add_column(sa.Column('tax_rate', sa.Float(), nullable=False, server_default='0.0'))
        
        # Add payment tracking fields
        batch_op.add_column(sa.Column('amount_paid', sa.Float(), nullable=False, server_default='0.0'))
        batch_op.add_column(sa.Column('amount_due', sa.Float(), nullable=False, server_default='0.0'))
        
        # Add date fields
        batch_op.add_column(sa.Column('invoice_date', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('last_reminder_sent', sa.DateTime(timezone=True), nullable=True))
        
        # Add text fields
        batch_op.add_column(sa.Column('terms', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('payment_method', sa.String(50), nullable=True))
        batch_op.add_column(sa.Column('payment_instructions', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('customer_po_number', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('billing_address', sa.JSON(), nullable=True))
        
        # Add recurring fields
        batch_op.add_column(sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('recurring_interval', sa.String(20), nullable=True))
        batch_op.add_column(sa.Column('recurring_next_date', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('recurring_parent_id', sa.String(36), nullable=True))
        
        # Add tracking fields
        batch_op.add_column(sa.Column('sent_to_customer', sa.Boolean(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('reminder_count', sa.Integer(), nullable=False, server_default='0'))
        
        # Add foreign keys
        batch_op.create_foreign_key('fk_invoices_subscription_id', 'subscriptions', ['subscription_id'], ['id'])
        batch_op.create_foreign_key('fk_invoices_license_id', 'licenses', ['license_id'], ['id'])
        batch_op.create_foreign_key('fk_invoices_recurring_parent', 'invoices', ['recurring_parent_id'], ['id'])
    
    # Update amount_due for existing invoices
    op.execute('UPDATE invoices SET amount_due = total WHERE amount_due = 0')
    
    # Create partial_payments table
    op.create_table(
        'partial_payments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('invoice_id', sa.String(36), sa.ForeignKey('invoices.id'), nullable=False),
        sa.Column('payment_id', sa.String(36), sa.ForeignKey('payments.id'), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Create invoice_templates table
    op.create_table(
        'invoice_templates',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('items', sa.JSON(), nullable=True),
        sa.Column('tax_rate', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('discount_percent', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('terms', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('recurring_interval', sa.String(20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )


def downgrade():
    # Drop new tables
    op.drop_table('invoice_templates')
    op.drop_table('partial_payments')
    
    # Remove columns from invoices table
    with op.batch_alter_table('invoices', schema=None) as batch_op:
        batch_op.drop_constraint('fk_invoices_recurring_parent', type_='foreignkey')
        batch_op.drop_constraint('fk_invoices_license_id', type_='foreignkey')
        batch_op.drop_constraint('fk_invoices_subscription_id', type_='foreignkey')
        
        batch_op.drop_column('reminder_count')
        batch_op.drop_column('sent_to_customer')
        batch_op.drop_column('recurring_parent_id')
        batch_op.drop_column('recurring_next_date')
        batch_op.drop_column('recurring_interval')
        batch_op.drop_column('is_recurring')
        batch_op.drop_column('billing_address')
        batch_op.drop_column('customer_po_number')
        batch_op.drop_column('payment_instructions')
        batch_op.drop_column('payment_method')
        batch_op.drop_column('terms')
        batch_op.drop_column('last_reminder_sent')
        batch_op.drop_column('invoice_date')
        batch_op.drop_column('amount_due')
        batch_op.drop_column('amount_paid')
        batch_op.drop_column('tax_rate')
        batch_op.drop_column('discount_percent')
        batch_op.drop_column('discount_amount')
        batch_op.drop_column('license_id')
        batch_op.drop_column('subscription_id')

