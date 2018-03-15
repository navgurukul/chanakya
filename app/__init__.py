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

#import logging
#import logging.handlers
#
#logger = logging.getLogger('myLogger')
#logger.setLevel(logging.INFO)
#
##add handler to the logger
#handler = logging.handlers.SysLogHandler('/dev/log')
#
##add formatter to the handler
#formatter = logging.Formatter('Python: { "loggerName":"%(name)s", "timestamp":"%(asctime)s", "pathName":"%(pathname)s", "logRecordCreationTime":"%(created)f", "functionName":"%(funcName)s", "levelNo":"%(levelno)s", "lineNo":"%(lineno)d", "time":"%(msecs)d", "levelName":"%(levelname)s", "message":"%(message)s"}')
#
#handler.formatter = formatter
#logger.addHandler(handler)

from app import routes, models
