import requests
import sys

#phone_number = sys.argv[1]
#r = requests.put("http://localhost:5000/create-enrollment-key/%s" %phone_number)
#print(r.status_code)
#print(r.text)


#dummy questions



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
                r = requests.post("http://localhost:5000/create-question", data=d)
                print(r.status_code)
