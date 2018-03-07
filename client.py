import requests
import sys
from datetime import datetime
from qsn_dump import questions

def create_option_list(r_l, opt):
    for i in range(len(r_l)):
        if r_l[i] == opt:
            break
    return [r_l[i]] + r_l[:i] + r_l[i+1:]

try:
    phone_number = sys.argv[1]
    r = requests.put("http://127.0.0.1:8000/create-enrolment-key/%s" %phone_number)
    print(r.status_code)
    print(r.text)
except:
    for question in questions:
        options  = create_option_list(question['random_options'], question['answer'])
        d = {
                'en_question_text':  question['en_question_text'],
                'hi_question_text':  question['hi_question_text'],
                'difficulty':        question['difficulty'],
                'question_type':     question['question_type'],
                'category':          question['category'],
                'option_1':          options[0], 
                'option_2':          options[1],
                'option_3':          options[2],
                'option_4':          options[3]
        }
        t1 =datetime.now()
        print(d)
        r = requests.post("http://35.231.28.4/create-question", data=d)
        print(r.status_code)
        print(datetime.now()-t1)
