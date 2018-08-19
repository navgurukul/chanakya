import datetime, string, random

from chanakya.src import db, app

class EnrolmentKey(db.Model):

    __tablename__ = 'enrolment_keys'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(6), unique=True)
    test_start_time = db.Column(db.DateTime, nullable=True)
    test_end_time = db.Column(db.DateTime, nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    @staticmethod
    def generate_key(student_id):
        ALPHABETS, NUMBERS =  string.ascii_uppercase, string.digits
        enrollment_key = "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(3)])
        while EnrolmentKey.query.filter_by(key=enrollment_key).first():
            enrollment_key = "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(3)])
        enrollment = EnrolmentKey(student_id=student_id, key=enrollment_key)
        db.session.add(enrollment)
        db.session.commit()
        
        return enrollment_key

class Questions(db.Model):

    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    difficulty = db.Column(db.Enum(app.config['QUESTION_DIFFICULTY']), nullable=False)
    topic = db.Column(db.Enum(app.config['QUESTION_TOPIC']), nullable=False)
    type = db.Column(db.Enum(app.config['QUESTION_TYPE']), nullable=False)
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
