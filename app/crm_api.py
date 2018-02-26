import os, random
import requests, jinja2
import datetime

from app import app

def get_next_day():
    return (datetime.datetime.now().date() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

def get_abs_path(path):
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), path))
    return abs_path

def render(tpl_path, context):
    path, filename = os.path.split(tpl_path)
    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(path or './')
    ).get_template(filename).render(context)

def create_potential(student_details, crm_id=None):
    stage = student_details['stage']
    querystring = {
        "newFormat":"1",
        "authtoken":"dff429d03714ecd774b7706e358e907b",
        "scope":"crmapi",
    }
    if stage == "Entrance Test":
        xml_file = "templates/zoho/enrolled.xml"
        url = "https://crm.zoho.com/crm/private/json/Potentials/updateRecords"
        querystring["id"] = crm_id
    else:
        xml_file = "templates/zoho/interested.xml"
        url = "https://crm.zoho.com/crm/private/json/Potentials/insertRecords"

    owner_id = random.choice(app.config['POTENTIAL_OWNERS'])
    student_details['owner_id'] = owner_id

    querystring["xmlData"] = render(get_abs_path(xml_file), student_details)
    response = requests.request("GET", url, params=querystring)
    if response.status_code != 200:
        raise Exception("The student potential was not created successfully.")
    response = response.json()
    print(crm_id)
    print(student_details)
    print(response)
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
    if response.status_code == 200:
        if 'result' in response_json['response']:
            old_stages = get_stage_from_response(response)
            if stage in old_stages and stage == "Requested Callback":
                return False, None, response
            elif 'Enrolment Key Generated' in old_stages and stage=='Entrance Test':
                return True, 'update_enrolment_to_test', response.json()
            return True, "create_new", response
        elif 'nodata' in response_json['response']:
            return True, "create_new", response
    return False, "error",response
