git clone this repository in your home directory

# chanakya
Testing Platform of NavGurukul

## Setup

- sudo apt-get install mysql-server
- sudo apt-get install libmysqlclient-dev
- sudo apt-get install libmariadbclient-dev
- Make Sure you are in chanakya directory
- python3 -m venv venv
- pip install -r requirements.txt



- append these lines to your ~/.bashrc file
```bash
export FLASK_APP=${HOME}/chanakya/chanakya.py
export FLASK_DEBUG=1
```

flask db migrate
flask db upgrade

flask run -p 8000

###change db details in config.py


## Handling Config

The environment variable `CHANAKYA_ENV` needs to be set pointing to the location of the config file relative to the `app/` directory.

For example, your config file is stored in `config/local.py` the value of your `CHANAKYA_ENV` variable would be `../config/local.py`. Before running the app flask will automatically load the config from the given environment variable and set the relevant config values.

You can use `config/local.py` as your file name. It is also added in the `.gitignore`
