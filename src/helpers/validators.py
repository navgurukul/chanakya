from chanakya.src.models import EnrolmentKey, Questions

def check_enrollment_key(enrollment_key):
    '''
    the helper method  to validate that if the enrollment key is valid or not
    and return the response as per it's validation
    params:
        enollment : EnrolmentKey object required
    '''
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

def check_question_ids(questions_attempted):
    question_ids = [ question_attempt.get('question_id') for question_attempt in questions_attempted ]

    # check the question exist in the database
    questions = Questions.query.filter(Questions.id.in_(question_ids)).all()

    if not questions:
        return question_ids

    wrong_question_ids = [ question.id for question in questions if not question.id in question_ids ]
    # create the a new dict of {id:question}
    if wrong_question_ids:
        return wrong_question_ids

    questions_id_dict = { question.id: question for question in questions }
    # check if the question has the option_id in it if option_id is provided

    for question_attempt in questions_attempted:
        question_id = question_attempt.get('question_id')
        option_id = question_attempt.get('selected_option_id')
        question = questions_id_dict[question_id]
        option_id_list = [option.id for option in question.options.all()]
        if not option_id in option_id_list and option_id:
            wrong_question_ids.append(question_id)

    return wrong_question_ids

def check_option_ids(question_instance, question_dict):
    option_ids = [option.id for option in question_instance.options.all()]
    updated_option_ids = [option['id'] for option in question_dict['options']]

    if len(option_ids) != len(updated_option_ids):
        return updated_option_ids

    wrong_option_ids = [id for id in updated_option_ids if not id in option_ids]
    return wrong_option_ids
