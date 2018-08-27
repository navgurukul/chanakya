import os, random
import requests, jinja2
import datetime

from app import app

def get_next_day():
    return (datetime.datetime.now().date() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

def get_total_time_taken(test_data):
    time = (test_data.submitted_on - test_data.started_on).total_seconds()
    minute = int(time/60) 
    hour = int(minute/60)
    seconds =  int(time%60)
    time = '{0}h:{1}m:{2}s'.format(hour, minute, seconds) if hour else '{0}m:{1}s'.format(minute, seconds) 
    return time

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
    print(stage)
    
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

    if not stage in ("Personal Details Submitted","Enrolment Key Generated", "Requested Callback"):
        test_data = student_details['student'].test_data
        student_details['time'] = get_total_time_taken(test_data)

    if stage in ("All Details Submitted","Requested Callback"):
        student_details['call_flow_state'] = app.config['CRM_NEW_STUDENT_TASKS'][stage]['Call Flow State']


    if stage == "Requested Callback":
        owner_id = random.choice(app.config['REQUESTED_CALLBACK_POTENTIAL_OWNERS'])
    else:
        owner_id = random.choice(app.config['TEST_RELATED_POTENTIAL_OWNERS'])


    student_details['owner_id'] = owner_id
    student_details['test_version'] = app.config['TEST_VERSION']
    student_details['system_environment'] = app.config['SYSTEM_ENVIRONMENT']

    querystring["xmlData"] = render(get_abs_path(xml_file), student_details)
    response = requests.request("GET", url, params=querystring)
    # import pdb 
    # pdb.set_trace()
    if response.status_code != 200:
        raise Exception("The student potential was not created successfully.")
    response = response.json()
    potential_details = response['response']['result']['recorddetail']['FL']
    try:
        for detail in potential_details:
            if detail['val'] == 'Id':
                return detail['content'], owner_id
    except Exception as e:
        print(e)
        raise e
    

# creating the task related to the potential
def create_task_for_potential(potential_id, owner_id, task_text):

    task_details = {
        'owner_id': owner_id,
        'text': task_text,
        'due_date': get_next_day(),
        'se_module': 'Potentials',
        'se_id': potential_id
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
    print(url)
    response = requests.get(url)
    response_json = response.json()
    # print(response_json)
    if response.status_code == 200:
        if 'result' in response_json['response']:
            old_stages = get_stage_from_response(response)
            print(old_stages)
            if stage in old_stages and stage == "Requested Callback":
                return False, None, response
            elif stage == 'All Details Submitted':
                return True, 'already_at_all_detail', response.json()
            elif 'Enrolment Key Generated' in old_stages and stage=='Entrance Test':
                return True, 'update_enrolment_to_test', response.json()
            return True, "create_new", response
        elif 'nodata' in response_json['response']:
            return True, "create_new", response
    return False, "error",response


def is_there_task_for_all_details_submitted(potential_id):
    url = "https://crm.zoho.com/crm/private/json/Tasks/getRelatedRecords?authtoken=dff429d03714ecd774b7706e358e907b&parentModule=Potentials&id=%s" %potential_id
    print(url)
    response = requests.get(url)
    response_json = response.json()
    if response.status_code == 200:
        if 'result' in response_json['response']:
            all_responses = response_json['response']['result']['Tasks']['row']
            if type(all_responses) == type({}):
                print(all_responses['FL'][3]['content'])
                return all_responses['FL'][3]['content'] == "[All Details Submitted] Evaluate the answers and decide next steps."
            # for res in all_responses:
            #     print(res['FL'][3]['content'])
            #     if res['FL'][3]['content'] == "[All Details Submitted] Evaluate the answers and decide next steps.":
            #         return True
            return False
        elif 'nodata' in response_json['response']:
            return False