import datetime, enum

from chanakya.src import db

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

class EnrolmentKey(db.Model):

    __tablename__ = 'enrolment_keys'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(6), unique=True)
    test_start_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    test_end_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class StudentContact(db.Model):

    __tablename__ = 'student_contacts'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.String(10))
    main_contact = db.Column(db.Boolean)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class OutgoingCalls(db.Model):

    __tablename__ = 'outgoing_calls'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class IncomingCallType(enum.Enum):
    rqc = 'RQC' # requested callback
    interested = 'INTERESTED' # interested calls (where the student has not clicked anything on the helpline)

class IncomingCalls(db.Model):

    __tablename__ = 'incoming_calls'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    call_type = db.Column(db.Enum(IncomingCallType), nullable=False)

class OutgoingSMSType(enum.Enum):
    test_fail = 'Entrance Test Failed'
    test_pass = 'Entrance Test Passed'
    enrolment_key_gen = 'Enrolment Key Generated'
    alg_interview_pass = 'Algebra Interview Passed'
    alg_interview_fail = 'Algebra Interview Failed'
    other = 'Other'

class OutgoingSMS(db.Model):

    __tablename__ = 'outgoing_sms'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    type = db.Column(db.Enum(OutgoingSMSType), nullable=False)
    text = db.Column(db.String(300))

class TestQuestionDifficulty(enum.Enum):
    easy = 'Easy'
    medium = 'Medium'
    hard = 'Hard'

class TestQuestionTopic(enum.Enum):
    topic1 = "Topic 1"
    topic2 = "Topic 2"
    topic3 = "Topic 3"
    topic4 = "Topic 4"

class TestQuestionType(enum.Enum):
    mcq = 'MQC'
    integer_answer = 'Integer Answer'

class Questions(db.Model):

    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    difficulty = db.Column(db.Enum(TestQuestionDifficulty), nullable=False)
    topic = db.Column(db.Enum(TestQuestionTopic), nullable=False)
    type = db.Column(db.Enum(TestQuestionType), nullable=False)
    answer = db.Column(db.String(10), nullable=False)

class QuestionOptions(db.Model):

    __tablename__ = 'question_options'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))


class QuestionAttempts(db.Model):

    __tablename__ = 'attempts'

    id = db.Column(db.Integer, primary_key=True)
    enrolment_key_id = db.Column(db.Integer, db.ForeignKey('enrolment_keys.id'))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    answer = db.Column(db.String(10), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
