'''
    this file contains description for all routes.
'''
VALIDATE_ENROLMENT_KEY_DESCRIPTION = '''
        responses:

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

MORE_STUDENT_DETAIL = '''
        responses:

            "KEY_DOESN'T_EXIST" : Enrollment key is not present in the database.
            "UPDATED_DATA": Data have been successfully added to the database
            "KEY_IS_NOT_USED": KEY is not used which means have not submitted or gave the test so we can't taked
                                detials until the test is over.
'''
