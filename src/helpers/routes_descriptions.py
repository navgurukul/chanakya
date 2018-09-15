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

CREATE_QUESTION = '''
        choice fields value that can be passed:
        'type': ['MCQ', 'Integer Answer'],
        'topic': ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4'],
        'difficulty': ['Easy', 'Medium', 'Hard'],
        'en_text': Question in English,
        'hi_text': Question in Hindi,
        'options' contains a list of option as
        'options': [
            {
                'en_text': 'Option in English',
                'hi_text': 'Option in Hindi',
                'correct': True  if it's correct option for the question else False
            }
        ]
'''

PERSONAL_DETAILS_DESCRIPTION = '''
        responses:
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
