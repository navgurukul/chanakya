from app.models import Enrollment
from app.models import Options, Question
from app.models import Difficulty, QuestionType
from app import db

def add_enrollment_key(enrollment_key, phone_number):
    try:
        en = Enrollment(enrollment_key=enrollment_key, phone_number=phone_number)
        db.session.add(en)
        db.session.commit()
    except Exception as e:
        #log error
        print(e)
    else:
        return enrollment_key
def create_question(question_details):
    try:
        options   = question_details["options"] 
        q_options = Options(option_1=options[0], option_2=options[1], option_3=options[2], option_4=options[3])
        question  = Question(
                                en_question_text = question_details["en_question_text"],
                                hi_question_text = question_details["hi_question_text"],
                                question_type = getattr(QuestionType, question_details["question_type"]),
                                difficulty    = getattr(Difficulty, question_details["difficulty"]),
                                category      = question_details["category"],
                            )
        question.options = q_options
        db.session.add(q_options)
        db.session.commit()
    except Exception as e:
        error = str(e)
        return False, error
    else:
        
        return True, None

def is_valid_enrolment(phone_number):
    return True

def can_start_test(enrolment_key):
    return True
