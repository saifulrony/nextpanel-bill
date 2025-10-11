"""Add NextPanel integration tables

Revision ID: 003_add_nextpanel_tables
Revises: 002_update_invoice_schema
Create Date: 2025-10-11 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_nextpanel_tables'
down_revision = '002_update_invoice_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create nextpanel_servers table
    op.create_table('nextpanel_servers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('base_url', sa.String(length=255), nullable=False),
        sa.Column('api_key', sa.String(length=255), nullable=False),
        sa.Column('api_secret', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_online', sa.Boolean(), default=True),
        sa.Column('last_checked', sa.DateTime(), nullable=True),
        sa.Column('capacity', sa.Integer(), default=100, nullable=False),
        sa.Column('current_accounts', sa.Integer(), default=0, nullable=False),
        sa.Column('server_ip', sa.String(length=45), nullable=True),
        sa.Column('location', sa.String(length=100), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_nextpanel_servers_id'), 'nextpanel_servers', ['id'], unique=False)
    
    # Create nextpanel_accounts table
    op.create_table('nextpanel_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('server_id', sa.Integer(), nullable=False),
        sa.Column('nextpanel_user_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=20), default='active'),
        sa.Column('suspension_reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('suspended_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(), nullable=True),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_nextpanel_accounts_id'), 'nextpanel_accounts', ['id'], unique=False)
    op.create_index(op.f('ix_nextpanel_accounts_customer_id'), 'nextpanel_accounts', ['customer_id'], unique=False)
    op.create_index(op.f('ix_nextpanel_accounts_order_id'), 'nextpanel_accounts', ['order_id'], unique=False)
    op.create_index(op.f('ix_nextpanel_accounts_server_id'), 'nextpanel_accounts', ['server_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_nextpanel_accounts_server_id'), table_name='nextpanel_accounts')
    op.drop_index(op.f('ix_nextpanel_accounts_order_id'), table_name='nextpanel_accounts')
    op.drop_index(op.f('ix_nextpanel_accounts_customer_id'), table_name='nextpanel_accounts')
    op.drop_index(op.f('ix_nextpanel_accounts_id'), table_name='nextpanel_accounts')
    op.drop_table('nextpanel_accounts')
    
    op.drop_index(op.f('ix_nextpanel_servers_id'), table_name='nextpanel_servers')
    op.drop_table('nextpanel_servers')

