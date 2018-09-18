"""Add _question_ids column to QuestionSet

Revision ID: e4be045375f7
Revises: f369aed7b549
Create Date: 2018-09-18 18:13:23.946296

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e4be045375f7'
down_revision = 'f369aed7b549'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('sets', sa.Column('_question_ids', sa.String(length=200), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('sets', '_question_ids')
    # ### end Alembic commands ###
