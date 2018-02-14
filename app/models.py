from app import db
import datetime
from enum import Enum

class Difficulty(Enum):
    easy   = 1
    medium = 2
    hard   = 3

class QuestionType(Enum):
    MCQ          = 1
    short_answer = 2
    view         = 3

class Enrollment(db.Model):
    __tableame__ = "enrollment"
    id             = db.Column(db.Integer, primary_key=True)
    enrollment_key = db.Column(db.String(5), index=True, unique=True)
    phone_number   = db.Column(db.String(10), unique=True, index=True)
    created_on     = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return '<Enrollment: %s, Phone number: %d>' %(self.enrollment_key, self.phone_number) 

class Options(db.Model):
    __tablename__     = "options"
    id                = db.Column(db.Integer, primary_key=True)
    option_1         = db.Column(db.String(128)) #this is the answer
    option_2         = db.Column(db.String(128))
    option_3         = db.Column(db.String(128))
    option_4         = db.Column(db.String(128))

class Question(db.Model):
    __tablename__      = "question"
    id                 = db.Column(db.Integer, primary_key=True)
    en_question_text   = db.Column(db.String(1024), nullable=False)
    hi_question_text   = db.Column(db.String(1024), nullable=False)
    difficulty         = db.Column(db.Enum(Difficulty), nullable=False)
    category           = db.Column(db.String(32), nullable=False)
    question_type      = db.Column(db.Enum(QuestionType), nullable=False)
    options_id         = db.Column(db.Integer, db.ForeignKey("options.id"))
    options            = db.relationship("Options", backref=db.backref("options", uselist=False))

    def __repr__(self):
        return '<Question: %s>' %(self.question_text) 
