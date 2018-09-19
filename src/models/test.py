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
    question_set_id = db.Column(db.Integer, db.ForeignKey('sets.id'))
    # score = db.Column(db.Integer, nullable=True)

    question_set = db.relationship("QuestionSet", back_populates="enrolment_key")
    student = db.relationship("Student")

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

    def calculate_test_score(self):
        attempts = self.attempts.all()
        # get marks config
        marks_config = app.config['QUESTION_CONFIG']['marks_config']

        score = 0
        # iterate over each question
        for attempt in attempts:
            question_id = attempt.question_id
            question = Questions.query.get(question_id)
            is_correct = False
            # for mcq check if the id which is select is correct = True or not
            if question.type.value == 'MCQ':
                selected_option_id = attempt.selected_option_id
            # for integer_answer strip both attempt answer and answer in the db and check if both are equal or not
                option = QuestionOptions.query.get(selected_option_id)
                if option.correct:
                    is_correct = True
            else:
                option = question.options.all()[0]
                # using bs4 to convert the html string which is the database to text
                correct_answer = option.en_text.strip()
                student_answer = attempt.answer.strip()

                if correct_answer == student_answer:
                    is_correct = True

            # if the flag is true include the score in the score variable
            if is_correct:
                question_difficulty =  question.difficulty.value
                mark = marks_config[question_difficulty]
                score+=mark
        print(score)
        self.score = score
        db.session.add(self)
        db.session.commit()

    def get_question_set(self):
        """
        Generate a question set corresponding to this enrolment key and return
        the question set instanceself.

        Note: Also runs the start_test method on the instance.
        """
        self.start_test()
        question_set, questions = QuestionSet.create_new_set()
        self.question_set_id = question_set.id
        db.session.add(self)
        db.session.commit()
        return question_set, questions

    def start_test(self):
        '''
        Marks the `test_start_time` parameter of the enrolment key.
        Also marks the `test_end_time` as `test_start_time` + the time allowed for the test.
        '''
        current_datetime = datetime.now()
        self.test_start_time = current_datetime
        self.test_end_time = current_datetime + timedelta(seconds=app.config['TEST_DURATION'])

    def end_test(self):
        """
        This records the end time of the test in `test_end_time` attribute.
        """
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

class Questions(db.Model):

    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    en_text = db.Column(db.Unicode(2000, collation='utf8mb4_unicode_ci'))
    hi_text = db.Column(db.Unicode(2000, collation='utf8mb4_unicode_ci'))
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
        'question_dict': {
            'id': 1,
            'hi_text':'some question',
            'en_text':'some question',
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
        # recording the answer
        for question_attempt in questions_attempts:
            question_attempt['enrolment_key_id'] = enrollment.id
            if not question_attempt.get('selected_option_id'):
                question_attempt['selected_option_id'] = None
            attempt = QuestionAttempts(**question_attempt)
            db.session.add(attempt)
        db.session.commit()

class QuestionSet(db.Model):

    __tablename__ = 'sets'

    id = db.Column(db.Integer, primary_key=True)
    partner_name = db.Column(db.String(200))
    question_pdf_url= db.Column(db.String(200))
    answer_pdf_url= db.Column(db.String(200))
    _question_ids = db.Column(db.String(200))

    enrolment_key = db.relationship("EnrolmentKey", back_populates="question_set")

    def get_question_ids(self):
        return [int(i) for i in self._question_ids.split(',')]

    def set_question_ids(self, ids):
        self._question_ids = ','.join([str(i) for i in ids])

    def get_questions(self):
        """
        Get a list of all the questions associated with this question setself.
        Returns a list of instances of Questions.
        """
        # get the related questions
        ids = self.get_question_ids()
        questions = Questions.query.filter(Questions.id.in_(ids)).all()
        # order the questions as the order of the ids list
        # the _in caluse fucks up the order
        questions_map = {q.id: q for q in questions}
        questions = [questions_map[id] for id in ids]
        return questions

    @staticmethod
    def _generate_random_question_paper():
        """
        Generates a list of 18 questions as per the requirements of the config file.

        Returns a list of question instances.
        """
        questions = Questions.query.all()

        # arrange the question according to the topic and difficulty
        topics = app.config['QUESTION_CONFIG']['topic']
        questions_dict = {}
        for question in questions:
            topic = question.topic.value
            difficulty = question.difficulty.value
            if topic in topics.keys():
                if not questions_dict.get(topic):
                    questions_dict[topic]={}
                    questions_dict[topic][difficulty] = []
                elif not questions_dict[topic].get(difficulty):
                    questions_dict[topic][difficulty] = []
                questions_dict[topic][difficulty].append(question)

        # Select the question randomly according to topic and difficulty
        # Number of questions to be selected are defined in the CONFIG file.
        main_questions_list = []
        for topic in topics:
            for difficulty in topics[topic]:
                question_topic = questions_dict.get(topic)
                if not question_topic:
                    continue
                question_list = question_topic.get(difficulty)
                if not question_list:
                    continue
                # shuffle the list in place
                random.shuffle(question_list)
                # figure out how many questions of that topic & difficulty level are required
                required_question_num = topics[topic][difficulty]
                # pick the number of questions required as per the config file
                main_questions_list+=question_list[:required_question_num]

        # finally shuffle the list again while returning
        random.shuffle(main_questions_list)
        return main_questions_list

    @staticmethod
    def create_new_set(partner_name=None):
        '''
        Generates a new set of questions as per the logic defined in the config file.
        The config file mentions how many questions of which topic and difficulty level
        need to be included in a test.

        params:
        'partner_name': the partner for whom this is being generated
                        (defaults to None when the set is created for a student)
        '''
        questions = QuestionSet._generate_random_question_paper()
        ids = [question.id for question in questions]

        # Create a new question set
        question_set = QuestionSet(partner_name=partner_name)
        question_set.set_question_ids(ids)
        db.session.add(question_set)
        db.session.commit()

        return question_set, questions
