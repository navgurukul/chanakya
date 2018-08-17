from chanakya.src import db
from chanakya.src.models import EnrolmentKey
import string, random

def generate_random_string():
    '''
        The function generate the enrollment key of 6 digit which we use to validate a user test.
        Example: "AKL031" or "SDE232"
    '''
    # getting list of Alphabets and Number to make the random_string
    ALPHABETS, NUMBERS =  string.ascii_uppercase, string.digits
    return "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(3)])

def enrollment_generator():
    '''
        This function generates unique enrollment key whenever it is called to assign it
        to a student.
    '''
    # generates random string
    enrollment_key = generate_random_string()
    # condition to check if the key is already assigned to a student or not
    while EnrolmentKey.query.filter_by(key=enrollment_key).first():
        enrollment_key=generate_random_string()
    return enrollment_key

# adding any model instance to database
def add_to_db(model_instance):
    '''
    function that help to add models instance(tables) to the database
    requires models class instance with already the value in it to add to database

    EXAMPLE: add_to_db(student)
    Return None
    '''
    #adding data to the database
    db.session.add(model_instance)
    db.session.commit()
