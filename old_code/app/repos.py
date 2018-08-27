from app.models import *
from app import db, app, crm_api
import random
import exam_config
from datetime import datetime
import enum
import os

from app import app
STUDENT_DIRECTORY = app.config['STUDENT_DIRECTORY']

config = exam_config.config["question_config"]

def get_crm_id_from_enrolment(enrolment_key):
    en = Enrolment.query.filter_by(enrolment_key=enrolment_key).first()
    return en.crm_potential_id

def add_enrolment_key(enrolment_key, phone_number, crm_potential_id):
    try:
        en = Enrolment( enrolment_key=enrolment_key, phone_number=phone_number, 
                        crm_potential_id=crm_potential_id)
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

def get_global_q_set(config):
    '''
    optimization possible, shouldn't be called again and again!
    '''
    q_set = {}
    for category in config['categories']:
        q_set[category] = {}
        for difficulty in config['categories'][category]:
            q_set[category][difficulty] = [q.id for q in Question.query.filter_by(category=category).filter_by(difficulty=difficulty).all()]
    return q_set

def get_list_of_q_ids(global_q_set, category, difficulty, num):
    #move shuffle logic to get_global_q_set later
    random.shuffle(global_q_set[category][difficulty])
    return global_q_set[category][difficulty][:num]

def get_q_set(global_q_set, config):
    q_set = []
    for category in config:
        for difficulty in config[category]:
            q_set += get_list_of_q_ids(global_q_set, category, difficulty, config[category][difficulty])
    return q_set
 
def get_questions_for_q_set(q_set):
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

def get_all_questions():
    question_details = {}
    for question_set in config:
        question_details[question_set] = {}
        question_details[question_set]["info_before"] = config[question_set]["info_before"]
        question_details[question_set]["info_after"]  = config[question_set]["info_after"]
        question_details[question_set]["marks_config"]  = config[question_set]["questions"]["marks_config"]
        question_details[question_set]["time_per_question"]  = config[question_set]["questions"]["time_per_question"]
        global_q_set = get_global_q_set(config[question_set]["questions"])
        q_set        = get_q_set(global_q_set, config[question_set]['questions']['categories'])
        question_details[question_set]["questions"] = get_questions_for_q_set(q_set)
    return question_details

def add_test_data_to_db(enrolment_key, test_data_details):
    en = Enrolment.query.filter_by(enrolment_key=enrolment_key).first()
    td = TestData.query.filter_by(enrolment_id=en.id, set_name=test_data_details['set_name']).all()
    if len(td) == 0:
        test_data = TestData(**test_data_details)
        test_data.enrolment_id = en.id
        db.session.add(test_data)
        db.session.commit()

def create_dump_file(enrolment_key, stuff_to_save):
    f_path = os.path.join(STUDENT_DIRECTORY, "%s.py"%enrolment_key)
    with open(f_path, "a") as fp:
        fp.write(stuff_to_save)

def save_test_result_and_analytics(data_dump, other_details):
    enrolment_key     = other_details['enrolment_key']
    test_data_details = dict(       started_on          = other_details['start_time'],
                                    submitted_on        = other_details['submit_time'],
                                    received_marks      = data_dump['total_marks'],
                                    max_possible_marks  = data_dump['max_possible_marks'],
                                    set_name            = other_details['set_name'])
    add_test_data_to_db(enrolment_key, test_data_details)

def can_add_student(enrolment_key, student_data, action=None):
    #try:
        user_agent = student_data.get("user_agent", None)
        network_speed = student_data.get("network_speed", None)
        if action == 'create':
            non_enum_fields = ("name", "gender", "mobile", "dob", "user_agent", "network_speed")

        elif action == 'update':
            non_enum_fields = ("class_10_marks", "class_12_marks", "pin_code", "district",
            "tehsil", "city_or_village", "caste", "family_head_other", "fam_members", "earning_fam_members",
            "state","monthly_family_income", "family_head_income", "family_land_holding", "family_draught_animals")

        enum_fields = ( "school_medium", "qualification", "class_12_stream", "caste_parent_category", "urban_rural",
                        "family_head", "family_head_qualification", "urban_family_head_prof",
                        "rural_family_head_prof", "family_head_org_membership", "family_type", "housing_type")


        enums = (SchoolInstructionMedium, Qualification, Class12Stream, Caste, UrbanOrRural,
        FamilyHead, Qualification, UrbanProfessions, RuralProfessions, RuralOrgMembership, FamilyType,
        HousingType)

        student_details = {key: student_data.get(key) for key in non_enum_fields}

        if network_speed:
            student_details.update({"user_agent": user_agent})
            student_details.update({"network_speed": network_speed})

        for key in ("monthly_family_income", "family_head_income", "family_land_holding",
                     "family_draught_animals", "fam_members", "earning_fam_members"):
            if not student_details.get(key): #empty strings replaced by 0
                student_details[key] = 0

        for index in range(len(enums)):
            enum_data = student_data.get(enum_fields[index])
            if enum_data and enum_data!='NONE':
                student_details[enum_fields[index]] =  getattr(enums[index], enum_data)

        if student_details.get("dob") is not None:
            student_details["dob"] = datetime.strptime(student_details["dob"],'%Y-%m-%d').date()
        enrolment = Enrolment.query.filter_by(enrolment_key=enrolment_key).first()
        test_data = TestData.query.filter_by(enrolment_id=enrolment.id).first()
        if action =='create':
            student   = Student(**student_details)
        elif action == 'update':
            student = Student.query.filter_by(enrolment_id=enrolment.id).first()
            for key,value in student_details.items():
                setattr(student, key, value)
        student.items_owned  = student_data.getlist('items_owned')
        student.enrolment = enrolment
        student.test_data = test_data
        db.session.add(student)
        db.session.commit()
        return student
    #except Exception as e:
    #    print("logger was hit")
    #    #logger.error('''unable to add student in DB(and CRM),
    #    #                student_data:\n%s'''%st(student_data))
    #    return False

def add_to_crm(student_object, other_details, stage):
    enrolment_key = other_details.get("enrolment_key")
    crm_id = get_crm_id_from_enrolment(enrolment_key)
    if stage == 'All Details Submitted':
        if other_details.get('test_score')<=app.config['MINIMUM_PASSING_SCORE']:
            potential_id, owner_id = crm_api.create_potential({'student':student_object,'stage':'Entrance Test Failed'}, crm_id=crm_id)
            return
        on_all_detail_submitted_task = crm_api.is_there_task_for_all_details_submitted(student_object.enrolment.crm_potential_id)
        if on_all_detail_submitted_task:
            return
    potential_id, owner_id = crm_api.create_potential({'student':student_object,'stage':stage}, crm_id=crm_id)
    if potential_id:
        if stage in app.config['CRM_NEW_STUDENT_TASKS']:
            crm_api.create_task_for_potential(potential_id, owner_id, app.config['CRM_NEW_STUDENT_TASKS'][stage]["task_message"])


def get_student_details_from_phone_number(phone_number, stage):
    student_details = {
        'stage': stage,
        'source': 'Helpline',
        'potential_name': phone_number,
        'student_or_partner': 'Student',
        'student_mobile': phone_number
    }
    return student_details

def add_to_crm_if_needed(phone_number, stage):
    should_add_to_crm, action, response = crm_api.should_add_to_crm({'Potential Name':phone_number}, stage=stage)
    if should_add_to_crm:
        student_details = get_student_details_from_phone_number(phone_number, stage)
        if action == "create_new":
            potential_id, owner_id = crm_api.create_potential(student_details)
            if app.config['CRM_NEW_STUDENT_TASKS'].get(stage):
                crm_api.create_task_for_potential(potential_id, owner_id, app.config['CRM_NEW_STUDENT_TASKS'][stage]["task_message"])
            else:
                pass #data-analytics

def add_enrolment_to_crm(phone_number, enrolment_key):
    student_details = get_student_details_from_phone_number(phone_number, "Enrolment Key Generated")
    student_details['Enrolment_Key'] = enrolment_key
    potential_id, owner_id = crm_api.create_potential(student_details)
    return potential_id

def add_student_to_crm(student):
    pass
