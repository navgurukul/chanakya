git clone this repository in your home directory

# chanakya
Testing Platform of NavGurukul

## create chanakya database in mysql with user and password as chanakya too
```bash
mysql -u root -p

mysql> create database chanakya;
mysql> CREATE USER 'chanakya'@'localhost' IDENTIFIED BY 'chanakya';
mysql> GRANT ALL PRIVILEGES ON chanakya.* TO 'chanakya'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> quit
```

## Setup

- sudo apt-get install redis-server
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
export CHANAKYA_ENV=../config/testing_and_dev.py 
```
now open a new terminal window and close this one

flask db upgrade

## Handling Config

The environment variable `CHANAKYA_ENV` needs to be set pointing to the location of the config file relative to the `app/` directory.

For example, your config file is stored in `config/testing_and_dev.py` the value of your `CHANAKYA_ENV` variable would be `../config/testing_and_dev.py`. Before running the app flask will automatically load the config from the given environment variable and set the relevant config values.

You can use `config/local.py` as your file name. It is also added in the `.gitignore`

### Running app

flask run -p 8000

## To create Question run client.py - make sure you know what you are doing

- keep the server running and open a new terminal
- go to chanakya folder
- source venv/bin/activate
- python client.py rajeev

-create student_files folder in root dir of chanakya app
### Useful links:
Trello: https://trello.com/b/DJEYDHs1/chanakya
