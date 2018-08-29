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
        True : when we can is valid to be used,
        False : when we can't use the key anymore or it doesn't exist
}
'enrollment_key_status':{
        'NOT_USED' : The key is not used and but has been generated,
        'DOES_NOT_EXIST' : The key have not been generated or doesn't exist in the platform,
        'ALREADY_IN_USED' : A Student is already using to give the test but you can't post the data to it,
        'EXPIRED' : Time to generate a new key
    }
'''
