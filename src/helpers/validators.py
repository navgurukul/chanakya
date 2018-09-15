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

def check_option_ids(question_instance,question_dict):
    '''
        checks whether sent question and options are attached in the database or not
        is any id which has been sent is not present in the db
        ignore the option with id = 0 (None)

        params:
            question_instance (its the Questions model instance)
            question_dict (contains a dictionary of questions in it which is sent through the api)

        return:
            list of wrong options id

    '''

    option_ids = [option.id for option in question_instance.options.all()]

    updated_option_ids = [option.get('id') for option in question_dict['options'] if option['id'] != 0]

    wrong_option_ids = [id for id in updated_option_ids if not id in option_ids]

    return wrong_option_ids
