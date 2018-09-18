"""empty message

Revision ID: fd29632f91b5
Revises: 9f0bc16fe24d
Create Date: 2018-09-12 20:46:51.458783

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fd29632f91b5'
down_revision = '9f0bc16fe24d'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('questions', 'en_text', type_=sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), existing_type=sa.String(2000), existing_nullable=True)
    op.alter_column('questions', 'hi_text', type_=sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), existing_type=sa.String(2000), existing_nullable=True)
    op.alter_column('question_options', 'en_text', type_=sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), existing_type=sa.String(2000), existing_nullable=True)
    op.alter_column('question_options', 'hi_text', type_=sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), existing_type=sa.String(2000), existing_nullable=True)

def downgrade():
    op.alter_column('questions', 'en_text', existing_type = sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), type_=sa.String(2000), existing_nullable=True)
    op.alter_column('questions', 'hi_text', existing_type = sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), type_=sa.String(2000), existing_nullable=True)
    op.alter_column('question_options', 'en_text', existing_type = sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), type_=sa.String(2000), existing_nullable=True)
    op.alter_column('question_options', 'hi_text', existing_type = sa.String(2000, convert_unicode=True, collation='utf8mb4_unicode_ci'), type_=sa.String(2000), existing_nullable=True)
