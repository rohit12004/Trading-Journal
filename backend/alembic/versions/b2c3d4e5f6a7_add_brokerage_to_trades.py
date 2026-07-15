"""add brokerage to trades

Revision ID: b2c3d4e5f6a7
Revises: 6a2ea89ac09b
Create Date: 2026-07-15 18:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = '6a2ea89ac09b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('trades', sa.Column('brokerage', sa.Numeric(precision=18, scale=4), nullable=False, server_default='0.0000'))


def downgrade() -> None:
    op.drop_column('trades', 'brokerage')
