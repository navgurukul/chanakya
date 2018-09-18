'''
 This file contains the response object for all the routes.

'''

from flask_restplus import fields
from chanakya.src import app, api


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


#offline paper
question_set = api.model('question_set',{
    'set_name': fields.Integer(attribute=lambda x: x.id if x else None),
    'question_pdf_url': fields.String,
    'answer_pdf_url': fields.String,
    'partner_name': fields.String
})
