from flask import Flask, make_response, request
from flask_restplus import Api
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

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

# Import all the possible EndPoints
from chanakya.src.routes.sample import SampleRoute1,SampleRoute2

# Import all the models
from chanakya.src.models import *
