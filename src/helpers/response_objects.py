from flask_restplus import fields
from chanakya.src import app
option_obj = {
    "hi_text": fields.String,
    "en_text": fields.String,
    "correct": fields.Boolean(default=False)
}

question_obj = {
    'en_text': fields.String,
    'hi_text': fields.String,
    'difficulty': fields.String(enum=app.config['QUESTION_DIFFICULTY']._member_names_),
    'topic': fields.String(enum=app.config['QUESTION_TOPIC']._member_names_),
    'type': fields.String(enum=app.config['QUESTION_TYPE']._member_names_),
    'options': fields.List(fields.Nested(option_obj))
}
