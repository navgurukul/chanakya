import string, random
from datetime import datetime, timedelta

from chanakya.src import db, app


class Questions(db.Model):

    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.Unicode(2000, collation='utf8mb4_unicode_ci'))
    hi_text = db.Column(db.Unicode(2000, collation='utf8mb4_unicode_ci'))
    difficulty = db.Column(db.Enum(app.config['QUESTION_DIFFICULTY']), nullable=False)
    topic = db.Column(db.Enum(app.config['QUESTION_TOPIC']), nullable=False)
    type = db.Column(db.Enum(app.config['QUESTION_TYPE']), nullable=False)
    options = db.relationship('QuestionOptions', backref='question', cascade='all, delete-orphan', lazy='dynamic')
    questions_order = db.relationship('QuestionOrder', backref='question', lazy='dynamic')

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

        # creating question
        question = Questions(en_text=en_text, hi_text=hi_text, difficulty=difficulty, topic=topic, type=type)
        db.session.add(question)
        db.session.commit()

        # creating options for the above question
        for option in options:
            option['question_id'] = question.id
            question_option = QuestionOptions.create_option(**option)
        db.session.commit()
        return question

    def update_question(self, question_dict):
        '''
            the options helps to update a question with a new data and also add any new option if provided.
            params:
                question_dict = {
                    'id': 1,
                    'hi_text':'some question',
                    'en_text':'some question',
                    'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
                    'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
                    'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']

                    'options':[
                        {   'id': 1, // if it's a new option don't specify an ID
                            'en_text':'something',
                            'hi_text':'something',
                            'correct': True
                        },
                        {   'id': 2,
                            'en_text':'something',
                            'hi_text':'something',
                            'correct': False
                        },
                        {   'id': 3,
                            'en_text':'something',
                            'hi_text':'something',
                            'correct': False
                        },
                        {   'id': 4,
                            'en_text':'something',
                            'hi_text':'something',
                            'correct': True
                        }
                    ]
                }
            return None
        '''

        existing_options = { option.id: option for option in self.options.all() }

        updated_options = question_dict['options']

        self.en_text = question_dict.get('en_text')
        self.hi_text = question_dict.get('hi_text')
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

        db.session.commit()

    @staticmethod
    def get_random_question_set():
        '''
            It generates a set of 18 question randomly from the question that are in database according to
            the QUESTION_CONFIG define in config package which has the stored the number of question according to topic
            and difficulty.

            It requires minimum number of question to be in the database according to QUESTION_CONFIG variable to work properly
            else it will return question less than 18 in a set

            params: Not Required

            return list of 18 questions generated
                [<Question 1>,<Question 321>,<Question 331>,<Question 221>,<Question 111>,<Question 12>]
        '''

        questions = Questions.query.all()
        # category
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
        # from the config file
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
                main_questions_list+=question_list[:required_question_num]

        return main_questions_list

class EnrolmentKey(db.Model):

    __tablename__ = 'enrolment_keys'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(6), unique=True)
    test_start_time = db.Column(db.DateTime, nullable=True)
    test_end_time = db.Column(db.DateTime, nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    question_set_id = db.Column(db.Integer, db.ForeignKey('sets.id'))


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


    def extract_question_from_set(self):
        '''
            the function extract all the question that was generated when the test was started
            in the case of getting the question when the page was being refreshed or crashing of the website or any such
            situation the student wan't the question back.

            return [
                <Questions id>,
                <Questions id>,
                <Questions id>
            ]
        '''
        question_set_id = self.question_set_id
        question_set = QuestionSet.query.filter_by(id=question_set_id).first()
        question_order_list = question_set.questions.order_by(QuestionOrder.question_order).all()
        questions = [ question_order.question for question_order in question_order_list ]

        return questions


    def end_test(self):
        '''
            it helps to record the time when the test ends so we can find if the student has cheated or not

        '''
        self.test_end_time = datetime.now()
        db.session.add(self)
        db.session.commit()

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
            function to start the test for student.
        '''
        current_datetime = datetime.now()
        self.test_start_time = current_datetime
        self.test_end_time = current_datetime + timedelta(seconds=app.config['TEST_DURATION'])


class QuestionOptions(db.Model):

    __tablename__ = 'question_options'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.Unicode(2000, collation='utf8mb4_unicode_ci'))
    hi_text = db.Column(db.Unicode(2000, collation='utf8mb4_unicode_ci'))
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
        '''
            recording the answer made by omline question.

            params:
                questions_attempts = {
                    'enrolment_key_id' = 'ASA213',
                    'question_attempted': [
                        {
                            'question_id' : 23,
                            'selected_option_id' : 19,
                            'answer': 'string'
                        },
                        {
                            'question_id' : 23,
                            'selected_option_id' : 19,
                            'answer': 'string'
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

        #question create
        question = Questions(en_text=en_text, hi_text=hi_text, difficulty=difficulty, topic=topic, type=type)
        db.session.add(question)
        db.session.commit()

        # option for the question create
        for option in options:
            option['question_id'] = question.id
            question_option = QuestionOptions.create_option(**option)
        db.session.commit()
        return question

class QuestionSet(db.Model):

    __tablename__ = 'sets'

    id = db.Column(db.Integer, primary_key=True)
    partner_name = db.Column(db.String(200))
    url = db.Column(db.String(200))
    questions = db.relationship('QuestionOrder', backref='set', cascade='all, delete-orphan', lazy='dynamic')

    @staticmethod
    def create_new_set(partner_name=None):
        '''
            function to create a new set record for future refrence of calculating offline test score
            and getting the question set for online test

            params :
                questions : list of question instance
                partner_name: the partner_name , None when the set is created for a student.

        '''
        questions = Questions.get_random_question_set()

        question_set = QuestionSet(partner_name=partner_name)
        db.session.add(question_set)
        db.session.commit()

        # save the set to database in orderwise
        for index, question in enumerate(questions):
            question_order = QuestionOrder(question_order=index+1, question_id=question.id, set_id=question_set.id)
            db.session.add(question_order)
        db.session.commit()

        return question_set, questions


class QuestionOrder(db.Model):

    __tablename__ = 'question_order'

    id = db.Column(db.Integer, primary_key=True)
    enrolment_key_id = db.Column(db.Integer, db.ForeignKey('enrolment_keys.id'))
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))
    answer = db.Column(db.String(10), nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
