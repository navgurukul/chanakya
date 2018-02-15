import os

import requests, jinja2

student_details = {
    'stage': 'Lightbot Activity',
    'source': 'Helpline',

    'potential_name': 'Dr. Manhatan',
    'student_or_partner': 'Student',
    'student_mobile': '8130378953',
    'dob': '1995-05-02',
    'gender': 'Male',
    'caste_tribe': 'SC (Scheduled Caste)',
    'city': 'Panchkula',
    'state': 'Haryana',

    'owns_android': 'Yes',
    'owns_computer': 'Yes',
    'is_works': 'Yes',
    'works_where': 'NavGurukul',
    'num_fam_members': '4',
    'num_earning_fam_members': '2',
    'monthly_fam_income': '20000',
    'father_prof': 'Housekeeper',
    'mother_prof': 'Housemaid',

    'last_class_passed': 'Class 10th',
    'is_10_pass': 'Yes',
    'percentage_10': '10',
    'is_12_pass': 'Yes',
    'percentage_12': '10',
    'stream_11_12': 'Non Medical',
    'is_college_enrolled': 'Yes',
    'college_which': 'Delhi Uni',
    'college_type': 'Distance Education',
        
    'results_url': 'http://admissions.navgurukul.org/result/1234',    
    'test_version': 'New Version XYZ',
    'test_score': '100',
}


def render(tpl_path, context):
    path, filename = os.path.split(tpl_path)
    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(path or './')
    ).get_template(filename).render(context)

# creating the potential
querystring = {
    "newFormat":"1",
    "authtoken":"dff429d03714ecd774b7706e358e907b",
    "scope":"crmapi",
    "xmlData": render("../app/templates/zoho/new_potential_student.xml", student_details)
}
url = "https://crm.zoho.com/crm/private/json/Potentials/insertRecords"
response = requests.request("GET", url, params=querystring)
if response.status_code != 200:
    raise Exception("The student potential was not created successfully.")
response = response.json()
potential_details = response['response']['result']['recorddetail']['FL']
potential_id = None
for detail in potential_details:
    if detail['val'] == 'Id':
        potential_id = detail['content']
        break
if not potential_id:
    raise Exception("No ID of the potential was returned.")

# creating the task related to the potential
task_details = {
    'owner_id': '2821772000000169007',
    'text': 'Some text of the task.',
    'due_date': '2018-02-05',
    'se_module': 'Potentials',
    'se_id': potential_id
}
querystring = {
    "newFormat":"1",
    "authtoken":"dff429d03714ecd774b7706e358e907b",
    "scope":"crmapi",
    "xmlData": render("../app/templates/zoho/new_task.xml", task_details)
}
url = "https://crm.zoho.com/crm/private/json/Tasks/insertRecords"
response = requests.request("GET", url, params=querystring)
# check if response code is 200
