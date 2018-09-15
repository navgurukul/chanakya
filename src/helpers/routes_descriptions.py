'''
    this file contains description for all routes.
'''
VALIDATE_ENROLMENT_KEY_DESCRIPTION = '''
            responses
            'valid':{
                    True: already in use or not used till yet,
                    False: expired or doesn't exist
            }
            reason:{
                    'NOT_USED' : The key is not used and but has been generated,
                    'DOES_NOT_EXIST' : The key have not been generated or doesn't exist in the platform,
                    'ALREADY_IN_USED' : A Student is already using to give the test,
                    'EXPIRED' : Time to generate a new key
            }
'''


PERSONAL_DETAILS_DESCRIPTION = '''
        responses
        'success': {
                True : when the data is added,
                False : when we can't data can't be added
        }
        'enrollment_key_status':{
                'NOT_USED' : The key is not used and but has been generated,
                'DOES_NOT_EXIST' : The key have not been generated or doesn't exist in the platform,
                'ALREADY_IN_USED' : A Student is already using to give the test but you can't post the data to it,
                'EXPIRED' : Time to generate a new key
            }
'''
