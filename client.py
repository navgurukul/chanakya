import requests
import sys
from datetime import datetime
import time 
def create_option_list(r_l, opt):
    for i in range(len(r_l)):
        if r_l[i] == opt:
            break
    return [r_l[i]] + r_l[:i] + r_l[i+1:]

try:
    phone_number = int(sys.argv[1])
    r = requests.put("http://127.0.0.1:8000/create-enrolment-key/%s" %phone_number)
    print(r.status_code)
    print(r.text)
except:
    if sys.argv[1] == "rajeev":
        from qsn_dump import questions
    elif sys.argv[1] == "old":
        from old_test_questions import questions
    print(len(questions))
    for question in questions:
        if sys.argv[1] == "rajeev":
            print(question['random_options'])
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
            # print(questions.index(question))
        elif sys.argv[1] == "old":
            d = question
            # print(questions.index(question))

        t1 =datetime.now()
        # print(d)
        r = requests.post("http://127.0.0.1:8000/create-question", data=d)
        # time.sleep(1)
        # print(r.status_code)
        # print(datetime.now()-t1)
