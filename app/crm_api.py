import os, random
import requests, jinja2
import datetime

from app import app

def get_next_day():
    return (datetime.datetime.now().date() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

def get_abs_path(path):
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), path))
    return abs_path

def jinja2_finalize(thing):
    return thing if thing is not None else ''

def render(tpl_path, context):
    path, filename = os.path.split(tpl_path)
    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(path or './'),
        finalize=jinja2_finalize
    ).get_template(filename).render(context)

def create_potential(student_details, crm_id=None):
    """
    `student_details` would look something like this:
    {
        "student": student # student model,
        "stage": "string of stage value",
    }
    """
    stage = student_details['stage']
    querystring = {
        "newFormat":"1",
        "authtoken":"dff429d03714ecd774b7706e358e907b",
        "scope":"crmapi",
    }
    if stage in ("Enrolment Key Generated", "Requested Callback"):
        xml_file = "templates/zoho/interested.xml"
        url = "https://crm.zoho.com/crm/private/json/Potentials/insertRecords"
    else:
        xml_file = "templates/zoho/enrolled.xml"
        url = "https://crm.zoho.com/crm/private/json/Potentials/updateRecords"
        querystring["id"] = crm_id

    #############################################################################
    if stage == 'Entrance Test':    
        print('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
        print(student_details['student'].test_data.received_marks)
        print('++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++')
    #############################################################################
    
    owner_id = random.choice(app.config['POTENTIAL_OWNERS']) 

    student_details['owner_id'] = owner_id
    student_details['test_version'] = app.config['TEST_VERSION']
    student_details['system_environment'] = app.config['SYSTEM_ENVIRONMENT']
    
    querystring["xmlData"] = render(get_abs_path(xml_file), student_details)
    # print(querystring)
    response = requests.request("GET", url, params=querystring)
    if response.status_code != 200:
        raise Exception("The student potential was not created successfully.")
    response = response.json()
    potential_details = response['response']['result']['recorddetail']['FL']
    try:
        for detail in potential_details:
            if detail['val'] == 'Id':
                if stage in app.config['CRM_NEW_STUDENT_TASKS']:

                    task_stage = '_'.join((stage.upper()).split())+'_TASK_OWNERS'
                    task_owner_id = random.choice(app.config[task_stage])
                    print(task_owner_id, task_stage)
                    return detail['content'], owner_id, task_owner_id
                
                return detail['content'], owner_id, None
    except Exception as e:
        print(e)
        raise e
    

# creating the task related to the potential
def create_task_for_potential(potential_id, owner_id, task_text, task_description):
    # if task_text == "Call back and take next steps.":
    #     description = 'a'
    # elif task_text == "Evaluate the answers and decide next steps.":
    #     description = 'b'


    task_details = {
        'owner_id': owner_id,
        'text': task_text,
        'due_date': get_next_day(),
        'se_module': 'Potentials',
        'se_id': potential_id,
        'description': task_description,
    }
    print('--------')
    print(task_details)
    print('--------')
    querystring = {
        "newFormat":"1",
        "authtoken":"dff429d03714ecd774b7706e358e907b",
        "scope":"crmapi",
        "xmlData": render(get_abs_path("templates/zoho/new_task.xml"), task_details)
    }
    url = "https://crm.zoho.com/crm/private/json/Tasks/insertRecords"
    response = requests.request("GET", url, params=querystring)
    if response.status_code != 200:
        raise Exception("Something went wrong.")
    return True

def get_stage_from_response(response):
    d = response.json()
    lst = []
    if isinstance(d['response']['result']['Potentials']['row'], dict):
        for d_item in d['response']['result']['Potentials']['row']['FL']:
            if d_item['val'] == 'Stage':
                lst = [d_item['content']]
    else:
        for fl_dict in d['response']['result']['Potentials']['row']:
            for dct in fl_dict['FL']:
                if dct['val'] == 'Stage':
                    lst.append(dct['content'])
    return lst

def should_add_to_crm(search_criteria, stage):
    #search_string = "(%s)" %"And".join("(%s:%s)" %(str(x), str(y)) for x,y in search_criteria.items())
    search_string = "(%s:%s)" %list(search_criteria.items())[0]
    url = "https://crm.zoho.com/crm/private/json/Potentials/searchRecords?authtoken=dff429d03714ecd774b7706e358e907b&scope=crmapi&criteria=%s" %search_string
    response = requests.get(url)
    response_json = response.json()
    if response.status_code == 200:
        if 'result' in response_json['response']:
            old_stages = get_stage_from_response(response)
            if stage in old_stages and stage == "Requested Callback":
                return False, None, response
            elif 'Enrolment Key Generated' in old_stages and stage=='Entrance Test':
                return True, 'update_enrolment_to_test', response.json()
            elif old_stages:
                return True, 'just_create_task', response
        elif 'nodata' in response_json['response']:
            return True, "create_new", response
    return False, "error",response
