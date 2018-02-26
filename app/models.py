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
    yes = "Yes"
    no  = "No"

class Gender(Enum):
    male   = "Male"
    female = "Female"
    others = "Others"

class Caste(Enum):
    SC = "(SC) Scheduled Caste"
    ST = "(ST) Scheduled Tribe"
    OBC = "(OBC) Other Backward Classes"
    General = "General"

class CollegeType(Enum):
    Normal = "Normal"
    Distant = "Distant Education"

class Stream_11_12(Enum):
    medical           = "Medical"
    non_medical       = "Non Medical"
    commerce_maths    = "Commerce (With Maths)"
    commerce_no_maths = "Commerce (Without Maths)"

class Enrolment(db.Model):
    __tablename__    = "enrolment"
    id               = db.Column(db.Integer, primary_key=True)
    enrolment_key    = db.Column(db.String(5), index=True, unique=True)
    phone_number     = db.Column(db.String(10), index=True)
    crm_potential_id = db.Column(db.String(20))
    created_on       = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return '<Enrolment: %s, Phone number: %d>' %(self.enrolment_key, self.phone_number) 

class TestData(db.Model):
    __tablename__      = "test_data"
    id                 = db.Column(db.Integer, primary_key=True)
    started_on         = db.Column(db.DateTime, nullable=False)
    submitted_on       = db.Column(db.DateTime, nullable=False)
    received_marks     = db.Column(db.Integer, nullable=False)
    max_possible_marks = db.Column(db.Integer, nullable=False)
    set_name           = db.Column(db.String(32), nullable=False)
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
    __tablename__   = "student"
    id              = db.Column(db.Integer, primary_key=True)
    potential_name  = db.Column(db.String(64), nullable=False)
    student_mobile  = db.Column(db.String(10), nullable=False)
    dob             = db.Column(db.Date, nullable=False)
    gender          = db.Column(db.Enum(Gender), nullable=False)
    city            = db.Column(db.String(64), nullable=False)
    state           = db.Column(db.String(64), nullable=False)
    caste_tribe     = db.Column(db.Enum(Caste), nullable=False)

    owns_android            = db.Column(db.Enum(Boolean), nullable=False)
    owns_computer           = db.Column(db.Enum(Boolean), nullable=False)
    is_works                = db.Column(db.Enum(Boolean), nullable=False)
    works_where             = db.Column(db.String(64), nullable=False)
    num_fam_members         = db.Column(db.Integer, nullable=False)
    num_earning_fam_members = db.Column(db.Integer, nullable=False)
    monthly_fam_income      = db.Column(db.Integer, nullable=False)
    father_prof             = db.Column(db.String(64), nullable=False)
    mother_prof             = db.Column(db.String(64), nullable=False)

    monthly_fam_income  = db.Column(db.Integer, nullable=False)
    last_class_passed   = db.Column(db.Integer, nullable=False)
    is_10_pass          = db.Column(db.Enum(Boolean), nullable=False)
    percentage_10       = db.Column(db.Integer, nullable=False)
    is_12_pass          = db.Column(db.Enum(Boolean), nullable=False)
    percentage_12       = db.Column(db.Integer, nullable=False)
    stream_11_12        = db.Column(db.Enum(Stream_11_12), nullable=False)
    is_college_enrolled = db.Column(db.Enum(Boolean), nullable=False)
    college_which       = db.Column(db.String(256), nullable=False)
    college_type        = db.Column(db.Enum(CollegeType), nullable=False)

    created_on   = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    enrolment_id = db.Column(db.Integer, db.ForeignKey("enrolment.id"))
    enrolment    = db.relationship("Enrolment", backref=db.backref("s_enrolment", uselist=False))
    test_data_id = db.Column(db.Integer, db.ForeignKey("test_data.id"))
    test_data    = db.relationship("TestData", backref=db.backref("test_data", uselist=False))
