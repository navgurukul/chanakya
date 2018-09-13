from qsn_dump import questions
import requests
from datetime import datetime
from pprint import pprint
import json
headers = {'content-type': 'application/json'}

for question in questions:
    pprint(question)
    t1 =datetime.now()
    print(question)
    r = requests.post("http://127.0.0.1:5000/question/create", data=json.dumps(question), headers=headers)
    print(r.status_code)
    print(datetime.now()-t1)
