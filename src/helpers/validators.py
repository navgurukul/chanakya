from chanakya.src.models import EnrolmentKey, Questions

def check_enrollment_key(enrollment_key):
    """
        The helper method  to validate that if the enrollment key is valid or not
        and return the response as per it's validation.

        Params:
            `enrollment_key` : EnrolmentKey object required

        Return:
            `result`:{
                "valid" : (False when the id is expired or doesn't exist) and (True if the id is not used or is in use),
                "reason": Reason of it's validation ["DOES_NOT_EXIST","NOT_USED","ALREADY_IN_USED","EXPIRED"]
            }
            `enrollment`: EnrolmentKey instance
    """
    enrollment = EnrolmentKey.query.filter_by(key=enrollment_key).first()

    #if there is no such enrollment key
    if not enrollment:
        return {
            "valid": False,
            "reason": "DOES_NOT_EXIST"
        }, enrollment

    # else not expire than start countdown and send it to them
    elif enrollment.is_valid() and not enrollment.in_use():
        return {
            'valid':True,
            'reason': 'NOT_USED'
        }, enrollment

    # checks if the enrollment key is not in use
    elif enrollment.in_use():
        return {
            'valid':True,
            'reason': 'ALREADY_IN_USED'
        }, enrollment

    # enrollment key is expired
    else:
        return {
            "valid": False,
            "reason": "EXPIRED"
        }, enrollment

def check_option_ids(question_dict, question_instance):
    """
        Checks whether sent question and options are attached in the database or not
        is any id which has been sent is not present in the db
        and it ignore any new options

        Params:
            `question_instance` : Questions model instance

            `question_dict` = {
                            'id': 1,
                            'hi_text':'some question',
                            'en_text':'some question',
                            'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
                            'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
                            'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
                            'options':[
                                {   'id': 1,
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
                                {   'en_text':'something',
                                    'hi_text':'something',
                                    'correct': True
                                }
                            ]
                        }

        Return:
            `wrong_option_ids` - list of wrong options id [1, 189, 231]

    """

    option_ids = [option.id for option in question_instance.options.all()]

    updated_option_ids = [option.get('id') for option in question_dict['options'] if option.get('id')]

    wrong_option_ids = [id for id in updated_option_ids if not id in option_ids]

    return wrong_option_ids

def check_question_ids(enrollment, questions_attempt):
    """
        Helper checks if all the questions id which was attempted by student does exist in database or not
        with a valid option id attached to it.
        Params :
            `question_attempt` = [
                        {
                            'question_id': 19,
                            'selected_option_id': 43
                        },
                        {
                            'answer': 216,
                            'question_id': 77,
                        },
                        {
                            'answer': -21,
                            'question_id': 77,
                        },
                        {
                            'question_id': 34,
                            'selected_option_id': 182
                        }
                    ]
            `enrollment` : Contains EnrolmentKey model instance
        Return :
            `wrong_question_ids` - list of wrong question_ids [77, 99, 41]
    """
    question_ids = [ question_attempt.get('question_id') for question_attempt in questions_attempt ]

    # check the question exist in the database
    questions = Questions.query.filter(Questions.id.in_(question_ids)).all()

    if not questions or len(questions) != len(question_ids):
        return question_ids # wrong_question_ids

    # create the a new dict of {id:question}
    questions_id_dict = { question.id: question for question in questions }

    wrong_question_ids = []
    # check if the question has the option_id in it if option_id is provided
    for question_attempt in questions_attempt:
        question_id = question_attempt.get('question_id')
        option_id = question_attempt.get('selected_option_id')
        question = questions_id_dict[question_id]
        option_id_list = [option.id for option in question.options.all()]
        if not option_id in option_id_list and option_id:
            wrong_question_ids.append(question_id)

    if wrong_question_ids:
        return wrong_question_ids

    # are questions from the same set or not
    wrong_question_ids = check_question_is_in_set(enrollment, questions_attempt)

    if wrong_question_ids:
        return wrong_question_ids

def check_question_is_in_set(enrollment, questions_attempt):
    """
        Validate the questions which has been submitted is in the question_set attached to the enrollment_key or not
        Params:
            `question_attempt` = [
                        {
                            'question_id': 19,
                            'selected_option_id': 43
                        },
                        {
                            'answer': 216,
                            'question_id': 77,
                        },
                        {
                            'answer': -21,
                            'question_id': 77,
                        },
                        {
                            'question_id': 34,
                            'selected_option_id': 182
                        }
                    ]
            `enrollment` : Contains EnrolmentKey model instance

        Return :
            `wrong_question_ids` - list of wrong_question_ids [77, 34]
    """
    question_set = enrollment.question_set
    questions = question_set.get_questions()
    question_ids = [question.id for question in questions]
    question_attempt_ids = [ question_attempt.get('question_id') for question_attempt in questions_attempt ]
    wrong_question_ids = [id for id in question_attempt_ids if not id in question_ids]
    print(wrong_question_ids)
    return wrong_question_ids

def check_option_ids(question_instance,question_dict):
    """
        Checks whether sent question and options are attached in the database or not
        is any id which has been sent is not present in the db
        and it ignore any new options

        Params:
            `question_instance` : Questions model instance
            `question_dict`:
            {
                'id': 1,
                'hi_text':'some question',
                'en_text':'some question',
                'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
                'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
                'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
                'options':[
                    {   'id': 1,
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
                    {   'en_text':'something',
                        'hi_text':'something',
                        'correct': True
                    }
                ]
            }
        Return :
            `wrong_option_ids` - list of wrong_option_ids [2,3]
    """

    existing_option_ids = [option.id for option in question_instance.options.all()]

    updated_option_ids = [option.get('id') for option in question_dict['options'] if option.get('id')]
    
    wrong_option_ids = [id for id in updated_option_ids if not id in existing_option_ids]
    return wrong_option_ids
