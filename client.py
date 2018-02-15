import requests
import sys
from datetime import datetime

try:
    phone_number = sys.argv[1]
    r = requests.put("http://127.0.0.1:5000/create-enrolment-key/%s" %phone_number)
    print(r.status_code)
    print(r.text)
except:
    for category in ["category-1", "category-2", "category-3", "category-4"]:
        for difficulty in ("easy", "hard", "medium"):
            for question_type in ("MCQ", "short_answer"):
                for num in range(1,51):
                    d = {
                            'en_question_text':'English %s - %s - %d' %(category, difficulty, num),
                            'hi_question_text':'हिंदी %s - %s - %d' %(category, difficulty, num),
                            'difficulty':difficulty,
                            'question_type':question_type,
                            'category':category,
                            'option_1':'option_1_%s' %category,
                            'option_2':'option_2_%s' %category,
                            'option_3':'OPTION_3_%s' %category,
                            'option_4':'OPTION_4_%s' %category
                        }
                    t1 =datetime.now()
                    r = requests.post("http://127.0.0.1:5000/create-question", data=d)
                    print(r.status_code)
                    print(d['en_question_text'])
                    print(datetime.now()-t1)
