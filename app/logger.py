import logging
import logging.handlers
from app import app
env = app.config['SYSTEM_ENVIRONMENT']

loggly = logging.getLogger('chanakyaLogger'+env)
loggly.setLevel(logging.INFO)

#add handler to the logger
handler = logging.handlers.SysLogHandler('/dev/log')

#add formatter to the handler
formatter = logging.Formatter('''Details: {
"loggerName":"%(name)s",
"timestamp":"%(asctime)s",
"pathName":"%(pathname)s",
"logRecordCreationTime":"%(created)f",
"functionName":"%(funcName)s",
"levelNo":"%(levelno)s",
"lineNo":"%(lineno)d",
"time":"%(msecs)d",
"levelName":"%(levelname)s",
"message":"%(message)s"}''')

handler.formatter = formatter
loggly.addHandler(handler)
