import datetime, enum

from chanakya.src import db, app

class Student(db.Model):

    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    stage = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class StudentStageTransition(db.Model):

    __tablename__ = 'stage_transitions'

    id = db.Column(db.Integer, primary_key=True)
    from_stage = db.Column(db.String(100), nullable=False)
    to_stage = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.String(1000))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
