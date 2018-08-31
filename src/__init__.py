from flask import Flask, make_response, request
from flask_restplus import Api
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
<<<<<<< HEAD

=======
import exotel
>>>>>>> 67b69fd4dad8ab1074580bf2eaafbb0fd5144268
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

<<<<<<< HEAD
=======
# Initialising the exotel api to send sms 
_exotel_auth = app.config.get("EXOTEL_AUTH")
exotel = exotel.Exotel(_exotel_auth['username'], _exotel_auth['password'])

>>>>>>> 67b69fd4dad8ab1074580bf2eaafbb0fd5144268
# Import all the possible EndPoints
from chanakya.src.routes import *

# Import all the models
from chanakya.src.models import *
