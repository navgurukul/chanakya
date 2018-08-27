import string, random
from datetime import datetime, timedelta

from chanakya.src import db, app

class EnrolmentKey(db.Model):

    __tablename__ = 'enrolment_keys'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(6), unique=True)
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

class Questions(db.Model):

    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    difficulty = db.Column(db.Enum(app.config['QUESTION_DIFFICULTY']), nullable=False)
    topic = db.Column(db.Enum(app.config['QUESTION_TOPIC']), nullable=False)
    type = db.Column(db.Enum(app.config['QUESTION_TYPE']), nullable=False)
    answer = db.Column(db.String(10))
    options = db.relationship('QuestionOptions', backref='question', cascade='all, delete-orphan', lazy='dynamic')

    @staticmethod
    def add_question(questions_data):
        '''
            function to create a new record for question.
            params:
                questions_data = {
                    'text':{
                        'hi_question_text':'some question',
                        'en_question_text':'some question'
                    },
                    'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
                    'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
                    'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
                    'answer': answer, // answer for the question can contain both Interger Value or the Option Name

                    // option will be only there when type == 'MQC'
                    'option':{
                        'option1':{
                            'en_text':'something',
                            'hi_text':'something'
                        },
                        'option2':{
                            'en_text':'something',
                            'hi_text':'something'
                        },
                        'option3':{
                            'en_text':'something',
                            'hi_text':'something'
                        },
                        'option4':{
                            'en_text':'something',
                            'hi_text':'something'
                        }

                    }
                }

        return question_data
        '''
        data = {}
        data['hi_text'] = questions_data['text'].get('hi_question_text')
        data['en_text'] = questions_data['text'].get('en_question_text')

        # Enums Value
        question_difficulty = questions_data.get('difficulty')
        question_topic = questions_data.get('topic')
        question_type = questions_data.get('type')

        #Enums
        data['difficulty'] = app.config['QUESTION_DIFFICULTY'](question_difficulty)
        data['topic'] = app.config['QUESTION_TOPIC'](question_topic)
        data['type'] = app.config['QUESTION_TYPE'](question_type)

        question = Questions(**data)
        db.session.add(question)
        db.session.commit()

        #creating options if it is a MCQ question
        if question_type == 'MQC':
            for option_key in questions_data['option'].keys():
                option_data = questions_data['option'][option_key]
                question_option = QuestionOptions.create_option(**option_data, question_id=question.id)
                #adding the id of the option which is answer to the question
                if questions_data.get('answer') == option_key:
                    question.answer = question_option.id
        #Saving the Integer Answer
        else:
            question.answer = questions_data.get('answer')

        db.session.add(question)
        db.session.commit()

        return questions_data

class QuestionOptions(db.Model):

    __tablename__ = 'question_options'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))

    @staticmethod
    def create_option(en_text, hi_text, question_id):
        '''
        Staticmethod to create option for a specific question_id in the database
        params:
            en_text : english text of the option,
            hi_text : hindi text of the option,
            question_id : id of the question of the options

        '''
        question_option = QuestionOptions(en_text=en_text, hi_text=hi_text, question_id=question_id)
        db.session.add(question_option)
        db.session.commit()

        return question_option

class QuestionAttempts(db.Model):

    __tablename__ = 'attempts'

    id = db.Column(db.Integer, primary_key=True)
    enrolment_key_id = db.Column(db.Integer, db.ForeignKey('enrolment_keys.id'))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    answer = db.Column(db.String(10), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    
