'''
 This file contains the response object for all the routes.

'''

from flask_restplus import fields
from chanakya.src import app, api


# key validation
enrollment_key_status = api.model('enrollment_key_status', {
    'success': fields.Boolean,
    'enrollment_key_status':fields.String
})
enrollment_key_validation = api.model('enrollment_key_validation',{
    'valid': fields.Boolean,
    'reason': fields.String
})


#question obbject
option_obj = api.model('options',{
    "hi_text": fields.String,
    "en_text": fields.String,
    "correct": fields.Boolean(default=False)
})
question_obj = api.model('questions',{
    'id': fields.Integer,
    'en_text': fields.String,
    'hi_text': fields.String,
    'difficulty': fields.String(enum=[attr.value for attr in app.config['QUESTION_DIFFICULTY']]),
    'topic': fields.String(enum=[attr.value for attr in app.config['QUESTION_TOPIC']]),
    'type': fields.String(enum=[attr.value for attr in app.config['QUESTION_TYPE']]),
    'options': fields.List(fields.Nested(option_obj))
})
questions_list_obj = api.model('questions_list', {
    'questions': fields.List(fields.Nested(question_obj))
})


# questions attempted
question_attempt = api.model('question_attempt',{
    'question_id': fields.Integer,
    'selected_option_id': fields.Integer
})

questions_attempts = api.model('questions_attempts', {
    'enrollment_key': fields.String,
    'question_attempted': fields.List(fields.Nested(question_attempt))
})
