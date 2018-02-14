from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Init the app
app = Flask(__name__)

# Load the config from an env var
app.config.from_envvar("CHANAKYA_ENV")

db = SQLAlchemy(app)
migrate = Migrate(app, db)

from app import routes, models
