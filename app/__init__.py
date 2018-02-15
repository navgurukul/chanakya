import exotel

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Init the app
app = Flask(__name__)

# Load the config from an env var
app.config.from_envvar("CHANAKYA_ENV")

# different global instances
db = SQLAlchemy(app)
migrate = Migrate(app, db)
_exotel_auth = app.config.get("EXOTEL_AUTH")
exotel = exotel.Exotel(_exotel_auth['username'], _exotel_auth['password'])

from app import routes, models
