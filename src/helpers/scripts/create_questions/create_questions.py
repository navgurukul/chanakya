"""
    This file helps to add dumy question for testing through api
    requires qsn_dump file with dumy questions

"""

from questions import questions
import requests
from datetime import datetime
from pprint import pprint
import json

HEADERS = {'content-type': 'application/json'}

for question in questions:
    r = requests.post("http://127.0.0.1:5000/questions", data=json.dumps(question), headers=HEADERS)
    print('------------------------')
    print(r.content)
    print('------------------------')
