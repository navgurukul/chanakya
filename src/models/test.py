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
        '''
            start the test for the student and provide him a time to end test
            which is define in the config file

        '''
        current_datetime = datetime.now()
        self.test_start_time = current_datetime
        self.test_end_time = current_datetime + timedelta(seconds=app.config['TEST_DURATION'])


class Questions(db.Model):

    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    common_text = db.Column(db.String(2000))
    difficulty = db.Column(db.Enum(app.config['QUESTION_DIFFICULTY']), nullable=False)
    topic = db.Column(db.Enum(app.config['QUESTION_TOPIC']), nullable=False)
    type = db.Column(db.Enum(app.config['QUESTION_TYPE']), nullable=False)
    options = db.relationship('QuestionOptions', backref='question', cascade='all, delete-orphan', lazy='dynamic')

    @staticmethod
    def create_question(question_dict):
        '''
            create a question object for the question_dict
            question_dict = {
                'hi_text':'some question',
                'en_text':'some question',
                'common_text': 'some commen text' #Common between both English and Hindi
                'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
                'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
                'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
                'options':[
                    {
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': True
                    },
                    {
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': False
                    },
                    {
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': False
                    },
                    {
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': True
                    }
                ]
            }
        '''
        en_text = question_dict.get('en_text')
        hi_text = question_dict.get('hi_text')
        difficulty = app.config['QUESTION_DIFFICULTY'](question_dict.get('difficulty'))
        topic = app.config['QUESTION_TOPIC'](question_dict.get('topic'))
        type = app.config['QUESTION_TYPE'](question_dict.get('type'))
        options = question_dict.get('options')
        common_text = question_dict.get('common_text')
        question = Questions(en_text=en_text, hi_text=hi_text, difficulty=difficulty, common_text=common_text, topic=topic, type=type)
        db.session.add(question)
        db.session.commit()

        for option in options:
            option['question_id'] = question.id
            question_option = QuestionOptions.create_option(**option)

        db.session.commit()

        return question

    def update_question(self, question_dict):
        """
        The method helps update the student data and also create or delete the option for the question as per requirement.
        Params:
            `question_dict`: {
                'id': 1,
                'hi_text':'some question',
                'en_text':'some question',
                'common_text': 'some commen text' #Common between both English and Hindi
                'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
                'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
                'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
                'options':[
                    {
                        'id': 1,
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': True
                    },
                    {
                        'id': 2,
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': False
                    },
                    {
                        'id': 3,
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': False
                    },
                    {   // don't specify an option ID if you want to create a new option.
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': True
                    }
                ]
            }
            *Note: If the question before had options with IDs 1,2,3,4 and while updating 1,2,3 are
                   specified then 4 would be deleted.*
        """

        existing_options = { option.id: option for option in self.options.all() }

        updated_options = question_dict['options']

        option_ids = [option['id'] for option in updated_options if option.get('id')]

        deletable_options = [option for option in existing_options.keys() if not option in option_ids]

        self.en_text = question_dict.get('en_text')
        self.hi_text = question_dict.get('hi_text')
        self.common_text = question_dict.get('common_text')
        self.difficulty = app.config['QUESTION_DIFFICULTY'](question_dict.get('difficulty'))
        self.topic = app.config['QUESTION_TOPIC'](question_dict.get('topic'))
        self.type = app.config['QUESTION_TYPE'](question_dict.get('type'))

        db.session.add(self)


        for updated_option in updated_options:
            id = updated_option.get('id')
            #updating options
            if id:
                option = existing_options[id]
                option.en_text = updated_option['en_text']
                option.hi_text = updated_option['hi_text']
                option.is_common = True if option.en_text == option.hi_text else False
                option.correct = updated_option['correct']
                db.session.add(option)
            else:
            # creating new options
                option = {}
                option['question_id'] = self.id
                option['en_text'] = updated_option['en_text']
                option['hi_text'] = updated_option['hi_text']
                option['correct'] = updated_option['correct']
                question_option = QuestionOptions.create_option(**option)


        for deletable_option in deletable_options:
            option = QuestionOptions.query.get(deletable_option)

            # unlinking all the attempts containing this options

            # attempts = QuestionAttempts.query.filter_by(selected_option_id=option.id).all()
            # for attempt in attempts:
            #     attempt.selected_option_id = None
            #     db.session.add(attempt)
            #     db.session.commit()

            db.session.delete(option)

        db.session.commit()

class QuestionOptions(db.Model):

    __tablename__ = 'question_options'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    is_common = db.Column(db.Boolean, default=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    correct = db.Column(db.Boolean, default=False)

    @staticmethod
    def create_option(**kwargs):
        '''
        Staticmethod to create option for a specific question_id in the database
        params:
            `en_text` : english text of the option, required, str
            `hi_text` : hindi text of the option, required, str
            `question_id` : id of the question of the options, required, int
            `correct` : False, bool
        '''
        # Checking if the text inside options is common or not
        if kwargs['en_text'] == kwargs['hi_text']:
            kwargs['is_common'] = True

        question_option = QuestionOptions(**kwargs)
        db.session.add(question_option)

        return question_option

class QuestionAttempts(db.Model):

    __tablename__ = 'attempts'

    id = db.Column(db.Integer, primary_key=True)
    enrolment_key_id = db.Column(db.Integer, db.ForeignKey('enrolment_keys.id'))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    answer = db.Column(db.String(10), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
