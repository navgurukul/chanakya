# chanakya
Testing Platform of NavGurukul

## Setup

- python3 -m venv venv
- pip install -r requirements.txt

- export FLASK_APP=/Users/lawliet/chanakya/chanakya.py
- export FLASK_DEBUG=1

flask db migrate
flask db upgrade

flask run

###change db details in config.py
