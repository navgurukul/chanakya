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
        Helps to check if the options that has id are attached to the question or not
        if the ids are not attached to question then it return a list of wrong ids

        params:
            question_instance : Questions model instance
            question_dict:
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
        return :
            list of wrong_option_ids
    '''

    option_ids = [option.id for option in question_instance.options.all()]
    updated_option_ids = [option['id'] for option in question_dict['options'] if option.get('id')]

    wrong_option_ids = [id for id in updated_option_ids if not id in option_ids]
    return wrong_option_ids
