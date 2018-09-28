"""empty message

Revision ID: 81af6865ed22
Revises: 59acf23e72f2
Create Date: 2018-08-14 17:52:33.675463

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '81af6865ed22'
down_revision = '59acf23e72f2'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('stage_transitions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('from_stage', sa.String(length=100), nullable=False),
    sa.Column('to_stage', sa.String(length=100), nullable=False),
    sa.Column('notes', sa.String(length=1000), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('student_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['student_id'], ['students.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column('enrolment_keys', sa.Column('test_end_time', sa.DateTime(), nullable=True))
    op.add_column('students', sa.Column('stage', sa.String(length=100), nullable=False))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('students', 'stage')
    op.drop_column('enrolment_keys', 'test_end_time')
    op.drop_table('stage_transitions')
    # ### end Alembic commands ###