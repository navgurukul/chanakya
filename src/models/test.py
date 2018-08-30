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
    options = db.relationship('QuestionOptions', backref='question', cascade='all, delete-orphan', lazy='dynamic')

    @staticmethod
    def create_question(question_dict):
        '''
            create a question object for the question_dict
            question_dict = {
                'hi_text':'some question',
                'en_text':'some question',
                'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
                'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
                'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
                'options':[
                    {
                        'en_text':'something',
                        'hi_text':'something',
                        'correct': True
                    },
                ]
            }
        '''
        en_text = question_dict.get('en_text')
        hi_text = question_dict.get('hi_text')
        difficulty = app.config['QUESTION_DIFFICULTY'](question_dict.get('difficulty'))
        topic = app.config['QUESTION_TOPIC'](question_dict.get('topic'))
        type = app.config['QUESTION_TYPE'](question_dict.get('type'))
        options = question_dict.get('options')

        question = Questions(en_text=en_text, hi_text=hi_text, difficulty=difficulty, topic=topic, type=type)
        db.session.add(question)
        db.session.commit()

        for option in options:
            option['question_id'] = question.id
            question_option = QuestionOptions.create_option(**option)
        db.session.commit()
        return question

    @staticmethod
    def get_random_question_set():
        questions = Questions.query.all()
        topics = app.config['QUESTION_CONFIG']['topic']

        #arrange the question according to the topic and difficulty
        questions_dict = {}
        for question in questions:
            topic = question.topic.value
            difficulty = question.difficulty.value

            if topic in topics.keys():
                if not questions_dict.get(topic):
                    questions_dict[topic]={}
                    questions_dict[topic][difficulty] = []
                    questions_dict[topic][difficulty].append(question)
                elif not questions_dict[topic].get(difficulty):
                    questions_dict[topic][difficulty] = []
                    questions_dict[topic][difficulty].append(question)
                else:
                    questions_dict[topic][difficulty].append(question)

        # Select the question randomly according to topic and difficulty
        main_questions_list = []
        for topic in topics:
            for difficulty in topics[topic]:
                question_topic = questions_dict.get(topic)

                if not question_topic:
                    continue
                question_list = question_topic.get(difficulty)
                if not question_list:
                    continue
                random.shuffle(question_list)
                required_question_num = topics[topic][difficulty]
                main_questions_list.append(question_list[:required_question_num])

        return main_questions_list

class QuestionOptions(db.Model):

    __tablename__ = 'question_options'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.String(2000))
    hi_text = db.Column(db.String(2000))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    correct = db.Column(db.Boolean, default=False)

    @staticmethod
    def create_option(**kwargs):
        '''
        Staticmethod to create option for a specific question_id in the database
        params:
            en_text : english text of the option, required, str
            hi_text : hindi text of the option, required, str
            question_id : id of the question of the options, required, int
            correct = False, bool

        '''
        question_option = QuestionOptions(**kwargs)
        db.session.add(question_option)

        return question_option

class QuestionAttempts(db.Model):

    __tablename__ = 'attempts'

    id = db.Column(db.Integer, primary_key=True)
    enrolment_key_id = db.Column(db.Integer, db.ForeignKey('enrolment_keys.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    selected_option_id = db.Column(db.Integer, db.ForeignKey('question_options.id')) #to store mcq answer
    answer = db.Column(db.String(10)) #to store integer value

    @staticmethod
    def create_attempts(questions_attempts, enrollment):
        # TODO:  needs to check question does exist or not with option
        for question_attempt in questions_attempts:
            question_attempt['enrolment_key_id'] = enrollment.id
            attempt = QuestionAttempts(**question_attempt)
            db.session.add(attempt)
        db.session.commit()
