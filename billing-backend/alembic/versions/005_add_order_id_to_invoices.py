"""Add order_id to invoices table

Revision ID: 005_add_order_id_to_invoices
Revises: 004_add_product_discounts
Create Date: 2025-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_order_id_to_invoices'
down_revision = '004_add_product_discounts'
branch_labels = None
depends_on = None


def upgrade():
    # Check if column already exists (for existing databases)
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('invoices')]
    
    if 'order_id' not in columns:
        # Add order_id column to invoices table
        with op.batch_alter_table('invoices', schema=None) as batch_op:
            batch_op.add_column(sa.Column('order_id', sa.String(36), nullable=True))
    
    # Create index for better query performance (check if it exists first)
    try:
        indexes = [idx['name'] for idx in inspector.get_indexes('invoices')]
        if 'ix_invoices_order_id' not in indexes:
            op.create_index('ix_invoices_order_id', 'invoices', ['order_id'], unique=False)
    except Exception:
        # Index creation might fail if it already exists, ignore
        pass


def downgrade():
    # Remove index and order_id column from invoices table
    try:
        op.drop_index('ix_invoices_order_id', table_name='invoices')
    except Exception:
        # Index might not exist, ignore
        pass
    
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('invoices')]
    
    if 'order_id' in columns:
        with op.batch_alter_table('invoices', schema=None) as batch_op:
            batch_op.drop_column('order_id')

