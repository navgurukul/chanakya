from app.models import Options, Question, TestData, Enrolment, Student
from app.models import Difficulty, QuestionType, Boolean, Gender, Stream_11_12, CollegeType, Caste
from app import db
import random
import exam_config
from datetime import datetime
from app import crm_api
import enum

config = exam_config.config["question_config"]

def add_enrolment_key(enrolment_key, phone_number):
    try:
        en = Enrolment(enrolment_key=enrolment_key, phone_number=phone_number)
        db.session.add(en)
        db.session.commit()
    except Exception as e:
        #log error
        print(e)
    else:
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
        non_enum_fields = ("works_where","num_fam_members","num_earning_fam_members","monthly_fam_income","father_prof","mother_prof","monthly_fam_income","last_class_passed","percentage_10","percentage_12","college_which","potential_name","student_mobile","dob","city","state")

        enum_fields = ("owns_android","owns_computer","is_works","is_10_pass","is_12_pass","stream_11_12","is_college_enrolled","college_type","gender","caste_tribe")

        enums = (Boolean, Boolean, Boolean, Boolean, Boolean, Stream_11_12, Boolean, CollegeType, Gender, Caste)

        student_details = {key: student_data.get(key) for key in non_enum_fields}
        student_details.update({enum_fields[index]: getattr(enums[index], student_data.get(enum_fields[index])) for index in range(len(enums))})

        student_details["dob"] = datetime.strptime(student_details["dob"],'%Y-%m-%d').date()
        enrolment = Enrolment.query.filter_by(enrolment_key=enrolment_key).first()
        test_data = TestData.query.filter_by(enrolment_id=enrolment.id).first()
        student   = Student(**student_details)
        student.enrolment = enrolment
        student.test_data = test_data
        db.session.add(student)
        db.session.commit()
        return student_details
    except Exception as e:
        #log e
        return False

def get_stage_for_student():
    return 'Lightbot Activity'

def add_to_crm(student_details, other_details):
    student_details = { k:student_details[k].value if isinstance(student_details[k], enum.Enum) else student_details[k] for k in student_details}
    all_student_details = {
        'stage': get_stage_for_student(),
        'source': 'Helpline',
        'student_or_partner': 'Student',
            
        'results_url': "admissions.navgurukul.org/view-result/%s" %other_details.get("enrolment_key"),
        'test_version': 'New Version XYZ',
        'test_score': other_details.get("test_score"),
    }
    all_student_details.update(student_details)
    import pdb; pdb.set_trace()
    potential_id = crm_api.create_potential(all_student_details)
    if potential_id:
        crm_api.create_task_for_potential(potential_id)
