"""Add first_billing_period_only to coupons table

Revision ID: 006_add_coupon_first_billing_period_only
Revises: 005_add_order_id_to_invoices
Create Date: 2025-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_add_coupon_first_billing_period_only'
down_revision = '005_add_order_id_to_invoices'
branch_labels = None
depends_on = None


def upgrade():
    # Check if column already exists (for existing databases)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('coupons')]
    
    if 'first_billing_period_only' not in columns:
        # Add first_billing_period_only column to coupons table
        with op.batch_alter_table('coupons', schema=None) as batch_op:
            batch_op.add_column(sa.Column('first_billing_period_only', sa.Boolean(), nullable=True, server_default='0'))


def downgrade():
    # Remove first_billing_period_only column from coupons table
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('coupons')]
    
    if 'first_billing_period_only' in columns:
        with op.batch_alter_table('coupons', schema=None) as batch_op:
            batch_op.drop_column('first_billing_period_only')

