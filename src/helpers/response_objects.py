"""
 This file contains the response object for all the routes.

"""

from flask_restplus import fields
from chanakya.src import app, api


#response and update object for question
option_obj = api.model('options',{
    "id": fields.Integer(required=False),
    "hi_text": fields.String(required=True),
    "en_text": fields.String(required=True),
    "correct": fields.Boolean(default=False, required=True)
})

question_obj = api.model('questions',{
    'id': fields.Integer(required=True),
    'en_text': fields.String(required=True),
    'hi_text': fields.String(required=True),
    'difficulty': fields.String(attribute=lambda x: x.difficulty.value if x else None, required=True),
    'topic': fields.String(attribute=lambda x: x.topic.value if x else None, required=True),
    'type': fields.String(attribute=lambda x: x.type.value if x else None, required=True),
    'options': fields.List(fields.Nested(option_obj), required=True)
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
