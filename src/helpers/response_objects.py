'''
 This file contains the response object for all the routes.
'''

from flask_restplus import fields
from chanakya.src import app, api


enrollment_key_validation = api.model('EnrollmentKeyValidtion',{
    'valid': fields.Boolean,
    'reason': fields.String
})

option_obj = api.model('options',{
    "id": fields.Integer,
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
