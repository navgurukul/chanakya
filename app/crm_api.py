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

def add_interested_to_crm(student_details):
    return create_potential(student_details, interested_potential=True)
    
def create_potential(student_details, interested_potential=False):
    if interested_potential:
        xml_file = "templates/zoho/interested.xml"
    else:
        xml_file = "templates/zoho/enrolled.xml"
    querystring = {
        "newFormat":"1",
        "authtoken":"dff429d03714ecd774b7706e358e907b",
        "scope":"crmapi",
        "xmlData": render(get_abs_path(xml_file), student_details)
    }
    url = "https://crm.zoho.com/crm/private/json/Potentials/insertRecords"
    response = requests.request("GET", url, params=querystring)
    if response.status_code != 200:
        raise Exception("The student potential was not created successfully.")
    response = response.json()
    potential_details = response['response']['result']['recorddetail']['FL']
    try:
        for detail in potential_details:
            if detail['val'] == 'Id':
                potential_id = detail['content']
                break
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

def exists_in_crm(search_criteria):
    #search_string = "(%s)" %"And".join("(%s:%s)" %(str(x), str(y)) for x,y in search_criteria.items())
    search_string = "(%s:%s)" %list(search_criteria.items())[0]
    url = "https://crm.zoho.com/crm/private/json/Potentials/searchRecords?authtoken=dff429d03714ecd774b7706e358e907b&scope=crmapi&criteria=%s" %search_string
    response = requests.get(url)
    if response.status_code == 200 and 'result' in response.json()['response']:
        return True
    return False