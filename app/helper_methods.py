import random
from exam_config import config
import string
from datetime import datetime, timedelta
import os, sys

from app import app
STUDENT_DIRECTORY = app.config['STUDENT_DIRECTORY']

sys.path.insert(0, STUDENT_DIRECTORY)

test_config = config["test_config"]

def get_random_string():
    ALPHABETS, NUMBERS =  string.ascii_uppercase, string.digits 
    return "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(2)])

def get_data_from_enrolment_file(enrolment_key):
    try:
        set_names = tuple(config.get('question_config').keys())
        en = __import__(enrolment_key)
        qa = {}
        for set_name in set_names:
            qa[set_name] = getattr(en, "qa_"+set_name)
        return qa, None
    except ImportError as e:
        return None, "Test Not Given or Wrong Enrolment Key"
    except Exception as e:
        return None, str(e)

def get_time_remaining(submit_time, submitted_set):
    set_deduction = test_config[submitted_set] if submitted_set else 0
    test_time  = test_config.get("test_time")
    seconds_spent_in_set  = (datetime.utcnow() - submit_time).seconds
    time_spent = set_deduction + seconds_spent_in_set
    return test_time - time_spent

def is_same_str_value(text_1, text_2):
    return str(text_1).strip().lower() == str(text_2).strip().lower()

def get_time_boundary(q_set, time_start_boundary):
    time_delta = q_set['info_before']['time_in_seconds'] + q_set['info_after']['time_in_seconds'] + q_set['time_per_question'] * len(q_set['questions'])
    return time_start_boundary + time_delta

def get_question_set(questions, time_remaining):
    # import pdb
    # pdb.set_trace()
    time_start_boundary = 0    
    index = 0
    set_names = sorted(list(questions.keys()))

    for set_name in set_names:
        time_end_boundary = get_time_boundary(questions[set_name], time_start_boundary)
        print("in loop:", set_name, time_remaining, time_start_boundary, time_end_boundary)
        if time_remaining > time_start_boundary and time_remaining <= time_end_boundary:
            is_last = True if index==0 else False
            print(time_remaining, time_start_boundary, time_end_boundary)
            return set_name, is_last, questions[set_name], time_remaining - time_start_boundary
        time_start_boundary = time_end_boundary
        index += 1

def calculate_marks(marks_config, question, user_answer):
    '''
        optimistic algo, assuming the question dict have all proper values.
    '''
    difficulty = question.get("difficulty")
    marks_add, marks_subtract = marks_config[difficulty]
    correct   = (marks_add, marks_subtract, marks_add)
    incorrect = (marks_subtract, marks_subtract, marks_add)
    return correct if is_same_str_value(user_answer, question.get('answer')) else incorrect


def dump_data_in_dict(dump_dict, question, user_answer):
    dump_dict["questions"].append({"question_details":question, "user_answer":user_answer})

def calculate_marks_and_dump_data(question_set, form):
    """
        Typical question:
        ----------------
        {'answer': 'option_1_category-4', 'category': 'category-4', 'difficulty': 'hard', 'en_question_text': 'English category-4 - hard - 9', 'hi_question_text': 'हिंदी category-4 - hard - 9', 'question_type': 'short_answer', 'random_options': ['option_1_category-4', 'option_2_category-4', 'OPTION_4_category-4', 'OPTION_3_category-4']}"""

    questions = question_set.get('questions')
    total_questions = len(questions)
    min_possible_marks, max_possible_marks, total_marks = 0, 0, 0
    dump_dict = {"questions":[]}
    for index in range(total_questions):
        question = questions[index]
        user_answer = form.get("answer_%d" %(index+1))
        marks, min_marks, max_marks = calculate_marks(question_set.get('marks_config'), question, user_answer)
        dump_data_in_dict(dump_dict, question, user_answer) 
        total_marks += marks
        min_possible_marks += min_marks
        max_possible_marks += max_marks
    #aggregated data points
    dump_dict["total_marks"] = total_marks
    dump_dict["max_possible_marks"] = max_possible_marks
    dump_dict["min_possible_marks"] = min_possible_marks
    dump_dict["total_questions"] = total_questions
    return dump_dict
