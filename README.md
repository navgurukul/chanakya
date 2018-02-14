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


## Handling Config

The environment variable `CHANAKYA_ENV` needs to be set pointing to the location of the config file relative to the `app/` directory.

For example, your config file is stored in `config/local.py` the value of your `CHANAKYA_ENV` variable would be `../config/local.py`. Before running the app flask will automatically load the config from the given environment variable and set the relevant config values.

You can use `config/local.py` as your file name. It is also added in the `.gitignore`