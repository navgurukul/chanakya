import requests
from pprint import pprint
import json

response = requests.get("http://127.0.0.1:5000/start/send_enrolment_key?mobile=7896121314&from_helpline=true")
enrollment_key = input('EnrollmentKey : ')

# submit personal details
personal_details_url = 'http://127.0.0.1:5000/test/personal_details'
data = {
    'enrollment_key': enrollment_key,
    'name':'Amar Kumar Sinha',
    'dob':'18-09-1997',
    'mobile_number':'7896121314',
    'gender':'MALE'
}
resp = requests.post(personal_details_url, data=data)
pprint(resp.json())

#start test
start_test_url = 'http://127.0.0.1:5000/test/start_test?enrollment_key={0}'.format(enrollment_key)
resp = requests.get(start_test_url)
response_json = resp.json()
pprint(response_json)
pprint(len(response_json['questions']))

end_test = {
    'enrollment_key':enrollment_key
}
questions_attempted = []

questions = response_json['questions']
for question in questions:
    data = {}
    if question['type'] == 'MQC':
        options = question['options']
        data['question_id'] = question['id']
        data['selected_option_id'] = options[0]['id']
        data['answer'] = None
    else:
        options = question['options']
        data['question_id'] = question['id']
        data['selected_option_id'] = 0
        data['answer'] = options[0]['en_text']
    questions_attempted.append(data)


end_test['question_attempted'] = questions_attempted
pprint(end_test)

# end test
end_test_url = "http://127.0.0.1:5000/test/end_test"
response = requests.post(end_test_url, data=json.dumps(end_test), headers = {'content-type': 'application/json'})

pprint(response.json())
