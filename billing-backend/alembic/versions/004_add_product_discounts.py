"""Add discount fields to plans table

Revision ID: 004_add_product_discounts
Revises: 003_add_nextpanel_tables
Create Date: 2025-12-18 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_product_discounts'
down_revision = '003_add_nextpanel_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Add discount columns to plans table
    with op.batch_alter_table('plans', schema=None) as batch_op:
        batch_op.add_column(sa.Column('discount_first_day', sa.Float(), nullable=True, server_default='0.0'))
        batch_op.add_column(sa.Column('discount_first_month', sa.Float(), nullable=True, server_default='0.0'))
        batch_op.add_column(sa.Column('discount_first_year', sa.Float(), nullable=True, server_default='0.0'))
        batch_op.add_column(sa.Column('discount_lifetime', sa.Float(), nullable=True, server_default='0.0'))


def downgrade():
    # Remove discount columns from plans table
    with op.batch_alter_table('plans', schema=None) as batch_op:
        batch_op.drop_column('discount_lifetime')
        batch_op.drop_column('discount_first_year')
        batch_op.drop_column('discount_first_month')
        batch_op.drop_column('discount_first_day')

