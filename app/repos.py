from app.models import Enrollment
from app.models import Options, Question
from app.models import Difficulty, QuestionType
from app import db
import random

config ={
            "category-1":{
                "easy":1,
                "medium":2,
                "hard":2
            },
            "category-2":{
                "easy":1,
                "medium":1,
                "hard":1
            },
            "category-3":{
                "easy":0,
                "medium":1,
                "hard":2
            },
            "category-4":{
                "easy":1,
                "medium":1,
                "hard":2
            }
}

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

def get_global_q_set():
    global config
    difficulties = ("easy", "medium", "hard")
    q_set = {}
    for category in config:
        q_set[category] = {}
        for difficulty in difficulties:
            q_set[category][difficulty] = [q.id for q in Question.query.filter_by(category=category).filter_by(difficulty=difficulty).all()]
    return q_set

def get_list_of_q_ids(global_q_set, category, difficulty, num):
    random.shuffle(global_q_set[category][difficulty])
    return global_q_set[category][difficulty][:num]

def get_q_set(global_q_set):
    global config
    q_set = []
    for category in config:
        for difficulty in config[category]:
            q_set += get_list_of_q_ids(global_q_set, category, difficulty, config[category][difficulty])
    return q_set
 
def get_all_questions(q_set):
    questions = []
    for q_id in q_set:
        question_obj = Question.query.get(q_id)
        answer = question_obj.options.option_1
        random_options =[   question_obj.options.option_1,
                            question_obj.options.option_2,
                            question_obj.options.option_3,
                            question_obj.options.option_4,
                        ]
        random.shuffle(random_options)
        question = {
                    "en_question_text":question_obj.en_question_text,
                    "hi_question_text":question_obj.hi_question_text,
                    "question_type":question_obj.question_type.name,
                    "difficulty":question_obj.difficulty.name,
                    "category":question_obj.category,
                    "random_options":random_options,
                    "answer":answer
        }
        questions.append(question)
    return questions
