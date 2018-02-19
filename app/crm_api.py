import os
import requests, jinja2

def get_abs_path(path):
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), path))
    print(abs_path)
    return abs_path

def render(tpl_path, context):
    path, filename = os.path.split(tpl_path)
    return jinja2.Environment(
        loader=jinja2.FileSystemLoader(path or './')
    ).get_template(filename).render(context)

def create_potential(student_details):
    querystring = {
        "newFormat":"1",
        "authtoken":"dff429d03714ecd774b7706e358e907b",
        "scope":"crmapi",
        "xmlData": render(get_abs_path("templates/zoho/new_potential_student.xml"), student_details)
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
        return potential_id
    except NameError:
        #log 
        pass
    except Exception as e:
        print(e) #log and email ?
    finally:
        return None
    

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
        pass #log_error and email
