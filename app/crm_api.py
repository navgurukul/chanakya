import os
import requests, jinja2

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
                return detail['content']
    except NameError:
        #log 
        pass
    except Exception as e:
        print(e) #log and email ?
        raise Exception("Something went wrong.")
    

# creating the task related to the potential
def create_task_for_potential(potential_id):
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
            if d_item['val'] == 'stage':
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
    if response.status_code == 200 and 'result' in response.json()['response']:
        old_stages = get_stage_from_response(response)
        if stage in old_stages and stage == "Requested Callback":
            return False, None, None
        elif 'Enrolment Key Generated' in old_stages and stage=='Entrance Test':
            return True, 'update_enrolment_to_test', response.json()
        return True, "create_new", None
    return False, "error",response
