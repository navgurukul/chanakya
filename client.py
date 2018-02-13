import requests
import sys

phone_number = sys.argv[1]

r = requests.put("http://localhost:5000/create-enrollment-key/%s" %phone_number)
print(r.status_code)
print(r.text)
