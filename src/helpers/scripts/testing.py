'''
    file to test start to end of test from enrollment genrated to start_test and then finshing it up
'''
import requests
from pprint import pprint
import json

########################### GENERATE ENROLLMENT KEY ############################
data = {
    'mobile':'7896121314',
    'from_helpline':True
}
response = requests.post("http://127.0.0.1:5000/start/send_enrolment_key", data=json.dumps(data),headers = {'content-type': 'application/json'})
response_json = response.json()

pprint(response_json)
enrollment_key = response_json['enrollment_key']
################################################################################



########################## PERSONAL DETAIL SUBMITTED ###########################
personal_details_url = 'http://127.0.0.1:5000/test/personal_details'
data = {
    'enrollment_key': enrollment_key,
    'name':'Amar Kumar Sinha',
    'dob':'1997-09-18',
    'mobile_number':'7002879316',
    'gender':'MALE'
}
resp = requests.post(personal_details_url, data=json.dumps(data), headers = {'content-type': 'application/json'})
pprint(resp.json())
################################################################################



##################################### START TEST ###############################
start_test_url = 'http://127.0.0.1:5000/test/start_test?enrollment_key={0}'.format(enrollment_key)
resp = requests.get(start_test_url)
response_json = resp.json()
pprint(response_json)
pprint(len(response_json['data']))
################################################################################




################################# END TEST #####################################
end_test = {
    'enrollment_key':enrollment_key
}
questions_attempted = []

questions = response_json['data']
for question in questions:
    data = {}
    if question['type'] == 'MCQ':
        options = question['options']
        for option in options:
            if option['correct']:
                data['question_id'] = question['id']
                data['selected_option_id'] = option['id']
    else:
        options = question['options']
        data['question_id'] = question['id']
        data['answer'] = options[0]['en_text']
    questions_attempted.append(data)


input('End the test? ')
end_test['questions_attempt'] =  questions_attempted
pprint(end_test)

end_test_url = "http://127.0.0.1:5000/test/end_test"
response = requests.post(end_test_url, data=json.dumps(end_test), headers = {'content-type': 'application/json'})

pprint(response.json())
################################################################################




################################ EXTRA DETAILS #################################

extra_details = {
    'enrollment_key':enrollment_key,
    'caste': 'OBC',
    'religion': 'Hindu',
    'monthly_family_income': 19000,
    'total_family_member': 7,
    'family_member_income_detail': 'Karlete hai jugaad'
}

more_details_url = "http://127.0.0.1:5000/test/extra_details"
response = requests.post(more_details_url, data=json.dumps(extra_details), headers = {'content-type': 'application/json'})
pprint(response.json())
################################################################################
