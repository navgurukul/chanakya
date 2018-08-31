<<<<<<< HEAD
import datetime
=======
import string, random
from datetime import datetime, timedelta
>>>>>>> 67b69fd4dad8ab1074580bf2eaafbb0fd5144268

from chanakya.src import db, app

class EnrolmentKey(db.Model):

    __tablename__ = 'enrolment_keys'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(6), unique=True)
<<<<<<< HEAD
    test_start_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    test_end_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
=======
    test_start_time = db.Column(db.DateTime, nullable=True)
    test_end_time = db.Column(db.DateTime, nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def generate_key(student_id):
        '''
            the method helps to generate a unique enrollment key for the student_id provided 
            and add it to student record.

            params: 
                student_id int required

            return enrollment (object associated to the student_id)
        '''
        # generating a new enrollment key
        ALPHABETS, NUMBERS =  string.ascii_uppercase, string.digits
        enrollment_key = "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(3)])
        
        # checking if the enrollment key already exist or not
        while EnrolmentKey.query.filter_by(key=enrollment_key).first():
            enrollment_key = "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(3)])
        
        # record the  enrollment key in the database
        enrollment = EnrolmentKey(student_id=student_id, key=enrollment_key)
        db.session.add(enrollment)
        db.session.commit()
        
        return enrollment

    def is_valid(self):
        '''
            the method checks if the key is been used or not
            if it is not used then the key is valid

            no params

            usage:
                enrollment.is_valid()

            return Boolean value

        '''

        current_datetime = datetime.now()

        # if the test hasn't started of the key it is valid
        if not self.test_start_time:
            return True
        
        # if the test has end for the enrollment key then it is not valid
        elif self.test_end_time and self.test_end_time <= current_datetime:
            return False

        #if the test is ongoing then it is valid 
        elif self.test_end_time > current_datetime:
            return True
    
    def in_use(self):
        '''
            check if the enrollment key is already in used or not
            
            no params

            usage: enrollment.in_use()

            return Boolean(true when it is being used else false)

        '''
        current_datetime = datetime.now()
        # if it is not used
        if not self.test_end_time or not self.test_start_time:
            return False
        # on being used
        elif self.test_end_time > current_datetime:
            return True
        return False

    def start_test(self):
        current_datetime = datetime.now()
        self.test_start_time = current_datetime
        self.test_end_time = current_datetime + timedelta(seconds=app.config['TEST_DURATION'])
        db.session.commit()
>>>>>>> 67b69fd4dad8ab1074580bf2eaafbb0fd5144268

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
