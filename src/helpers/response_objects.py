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

#response and update object for question
option_obj = api.model('options',{
    "id": fields.Integer(required=False),
    "hi_text": fields.String,
    "en_text": fields.String,
    "correct": fields.Boolean(default=False)
})

question_obj = api.model('questions',{
    'id': fields.Integer,
    'en_text': fields.String,
    'hi_text': fields.String,
    'difficulty': fields.String(attribute=lambda x: x.difficulty.value if x else None),
    'topic': fields.String(attribute=lambda x: x.topic.value if x else None),
    'type': fields.String(attribute=lambda x: x.type.value if x else None),
    'options': fields.List(fields.Nested(option_obj))
})

questions_list_obj = api.model('questions_list', {
    'questions': fields.List(fields.Nested(question_obj))
})


# create question
create_option = api.model('create_options',{
    "hi_text": fields.String(required=True),
    "en_text": fields.String(required=True),
    "correct": fields.Boolean(default=False, required=True)
})

create_question = api.model('create_questions',{
    'en_text': fields.String(required=True),
    'hi_text': fields.String(required=True),
    'difficulty': fields.String(enum=[attr.value for attr in app.config['QUESTION_DIFFICULTY']], required=True),
    'topic': fields.String(enum=[attr.value for attr in app.config['QUESTION_TOPIC']], required=True),
    'type': fields.String(enum=[attr.value for attr in app.config['QUESTION_TYPE']], required=True),
    'options': fields.List(fields.Nested(create_option), required=True)
})


# questions attempted
question_attempt = api.model('question_attempt',{
    'question_id': fields.Integer(required=True),
    'selected_option_id': fields.Integer(required=False),
    'answer': fields.String(required=False)
})


questions_attempts = api.model('questions_attempts', {
    'enrollment_key': fields.String(required=True),
    'question_attempted': fields.List(fields.Nested(question_attempt), required=True)
})


#offline paper
question_set = api.model('question_set',{
    'set_name': fields.Integer(attribute=lambda x: x.id if x else None),
    'pdf_url': fields.String(attribute=lambda x: x.url if x else None),
    'partner_name': fields.String
})
