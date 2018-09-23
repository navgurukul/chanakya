from flask import Flask, make_response, request
from flask_restplus import Api
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import exotel
from chanakya.src.config import ChanakyaConfig

# Initialising the Flask-App
app = Flask(__name__)
config = ChanakyaConfig.get_config()
app.config.from_object(config)

# Initialising Flask-RestPLUS
api = Api(app)

# Initialising Database & Migration support
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Initialising the exotel api to send sms
_exotel_auth = app.config.get("EXOTEL_AUTH")
exotel = exotel.Exotel(_exotel_auth['username'], _exotel_auth['password'])



# # Import all the possible EndPoints
# from chanakya.src.routes import *

# Import all the models
from chanakya.src.models import *


#Import all the api's
from chanakya.src.routes.offline_test import api as offline_test_api
from chanakya.src.routes.online_test import api as online_test_api
from chanakya.src.routes.questions import api as questions_api
from chanakya.src.routes.start_flow import api as start_flow_api

api.add_namespace(offline_test_api, path='/offline_test')
api.add_namespace(online_test_api, path='/online_test')
api.add_namespace(questions_api, path='/questions')
api.add_namespace(start_flow_api, path='/start')
