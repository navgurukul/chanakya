"""empty message

Revision ID: 911f63270ca9
Revises: 255ece945f0c
Create Date: 2018-08-29 15:18:03.973598

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '911f63270ca9'
down_revision = '255ece945f0c'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('question_options', sa.Column('correct', sa.Boolean(), nullable=True))
    op.drop_column('questions', 'answer')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('questions', sa.Column('answer', mysql.VARCHAR(length=10), nullable=True))
    op.drop_column('question_options', 'correct')
    # ### end Alembic commands ###
