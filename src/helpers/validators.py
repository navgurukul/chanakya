from chanakya.src.models import EnrolmentKey

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
