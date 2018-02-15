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

class Boolean(Enum):
    yes = 1
    no  = 0

class Gender(Enum):
    male   = 1
    female = 2
    others = 3

class Enrolment(db.Model):
    __tablename__  = "enrolment"
    id             = db.Column(db.Integer, primary_key=True)
    enrolment_key  = db.Column(db.String(5), index=True, unique=True)
    phone_number   = db.Column(db.String(10), index=True)
    created_on     = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return '<Enrolment: %s, Phone number: %d>' %(self.enrolment_key, self.phone_number) 

class TestData(db.Model):
    __tablename__      = "test_data"
    id                 = db.Column(db.Integer, primary_key=True)
    started_on         = db.Column(db.DateTime, nullable=False)
    submitted_on       = db.Column(db.DateTime, nullable=False)
    received_marks     = db.Column(db.Integer, nullable=False)
    max_possible_marks = db.Column(db.Integer, nullable=False)
    enrolment_id       = db.Column(db.Integer, db.ForeignKey("enrolment.id"))
    enrolment          = db.relationship("Enrolment", backref=db.backref("enrolment", uselist=False))

class Options(db.Model):
    __tablename__    = "options"
    id               = db.Column(db.Integer, primary_key=True)
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
        return '<Question: %s>' %(self.en_question_text) 

class Student(db.Model):
    __tablename__      = "student"
    id                 = db.Column(db.Integer, primary_key=True)
    name               = db.Column(db.String(64), nullable=False)
    address            = db.Column(db.String(2048), nullable=False)
    gender             = db.Column(db.Enum(Gender), nullable=False)
    owns_phone         = db.Column(db.Enum(Boolean), nullable=False)
    created_on         = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    enrolment_id       = db.Column(db.Integer, db.ForeignKey("enrolment.id"))
    enrolment          = db.relationship("Enrolment", backref=db.backref("s_enrolment", uselist=False))
    test_data_id       = db.Column(db.Integer, db.ForeignKey("test_data.id"))
    test_data          = db.relationship("TestData", backref=db.backref("test_data", uselist=False))
