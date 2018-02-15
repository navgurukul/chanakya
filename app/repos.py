from app.models import Options, Question, TestData, Enrolment, Student
from app.models import Difficulty, QuestionType, Boolean, Gender
from app import db
import random
import exam_config

config = exam_config.config["question_config"]

def add_enrolment_key(enrolment_key, phone_number):
    #try:
        en = Enrolment(enrolment_key=enrolment_key, phone_number=phone_number)
        db.session.add(en)
        db.session.commit()
#    except Exception as e:
#        #log error
#        print(e)
#    else:
        return enrolment_key

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

def is_valid_enrolment(enrolment_key):
    if enrolment_key.isalnum():
        if Enrolment.query.filter_by(enrolment_key=enrolment_key).first():
            return True
    return False

def can_start_test(enrolment_key):
    en_id = Enrolment.query.filter_by(enrolment_key=enrolment_key).first().id
    test_data = TestData.query.filter_by(enrolment_id=en_id).first()
    return True if test_data is None else False

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

def add_test_data_to_db(data_dump, other_details):
    enrolment_key     = other_details['enrolment_key']
    test_data_details = dict(       started_on          = other_details['start_time'],
                                    submitted_on        = other_details['submit_time'],
                                    received_marks      = data_dump['total_marks'],
                                    max_possible_marks  = data_dump['max_possible_marks'])
    en = Enrolment.query.filter_by(enrolment_key=enrolment_key).first()
    test_data = TestData(**test_data_details)
    test_data.enrolment = en
    db.session.add(test_data)
    db.session.commit()

def save_test_result_and_analytics(data_dump, other_details):
    add_test_data_to_db(data_dump, other_details)
    #create_dump_zip(data_dump, other_details)

def can_add_student(enrolment_key, student_data):

    try:
        student_details = {
                            "name": student_data.get("name"),
                            "address": student_data.get("address"),
                            "gender": getattr(Gender, student_data.get("gender")),
                            "owns_mobile": getattr(Boolean, student_data("owns_mobile"))
        }

        enrolment_key     = other_details['enrolment_key']
        enrolment = Enrolment.query.filter_by(enrolment_key=enrolment_key).first()
        test_data = TestData.query.filter_by(enrolment_id=enrolment.id).first()
        student   = Student(**student_details)
        student.enrolment = enrolment
        student.test_data = test_data
        db.session.add(student)
        db.session.commit()
    except Exception as e:
        #log e
        return False
    else:
        return True
