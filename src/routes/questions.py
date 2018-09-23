from io import BytesIO

from flask_restplus import Resource, reqparse, abort, marshal_with, fields, Namespace
from werkzeug.datastructures import FileStorage

from chanakya.src import app, db
from chanakya.src.models import (
					Student,
					IncomingCalls,
					StudentContact,
					Questions
			)

from chanakya.src.helpers.response_objects import question_obj, questions_list_obj
from chanakya.src.helpers.task_helpers import render_pdf_phantomjs
from chanakya.src.helpers.file_uploader import upload_file_to_s3, FileStorageArgument
from chanakya.src.helpers.validators import check_option_ids

api = Namespace('questions', description='Handle CRUD and file upload related to questions for the Test')

@api.route('/upload_file')
class UploadQuestionImage(Resource):

	post_parser = reqparse.RequestParser(argument_class=FileStorageArgument)
	post_parser.add_argument('image', required=True, type=FileStorage, location='files')

	@api.doc(parser=post_parser)
	def post(self):

		args = self.post_parser.parse_args()

		# upload to s3
		image = args['image']
		image_url = upload_file_to_s3(app.config['S3_QUESTION_IMAGES_BUCKET'], image)

		return {'image_url': image_url}


@api.route('')
class QuestionList(Resource):

	get_response = api.model('GET_questions_list', {
		'data' : fields.List(fields.Nested(question_obj)),
		'error':fields.Boolean(default=False),
		'message':fields.String
	})

	# Description of POST method
	CREATE_QUESTION = """
	Possible values of different JSON keys which can be passed.

	- 'type': ['MCQ', 'Integer Answer'],
	- 'topic': ['BASIC_MATH', 'ABSTRACT_REASONING', 'NON_VERBAL_LOGICAL_REASONING'],
	- 'difficulty': ['Easy', 'Medium', 'Hard'],
	- 'en_text': Question string in English,
	- 'hi_text': Question string in Hindi,

	- 'options': This will contain an array of options. Every object in the array will look like:
		[
		    {
		        'en_text': 'Option in English',
		        'hi_text': 'Option in Hindi',
		        'correct': True  if it's correct option for the question else False
		    }
		]
	"""

	# create question
	post_model_option = api.model('POST_questions_options',{
	    "hi_text": fields.String(required=True),
	    "en_text": fields.String(required=True),
	    "correct": fields.Boolean(default=False, required=True)
	})

	post_payload_model = api.model('POST_questions',{
	    'en_text': fields.String(required=True),
	    'hi_text': fields.String(required=True),
	    'difficulty': fields.String(enum=[attr.value for attr in app.config['QUESTION_DIFFICULTY']], required=True),
	    'topic': fields.String(enum=[attr.value for attr in app.config['QUESTION_TOPIC']], required=True),
	    'type': fields.String(enum=[attr.value for attr in app.config['QUESTION_TYPE']], required=True),
	    'options': fields.List(fields.Nested(post_model_option), required=True)
	})

	post_response = api.model('POST_questions_response', {
		'error': fields.Boolean(default=False),
		'message':fields.String,
		'data': fields.Nested(question_obj)
	})

	@api.marshal_with(get_response)
	def get(self):
		questions_list = Questions.query.all()
		if questions_list:
			return {
				"data":questions_list
			}
		return {
			'error':True,
			'message':'There no question on platform. Please add some question'
		}

	@api.marshal_with(post_response)
	@api.expect(post_payload_model)
	@api.doc(description=CREATE_QUESTION)
	def post(self):
		args = api.payload
		# create the question
		options = args.get('options')
		is_any_option_correct = False
		for option in options:
			if option['correct']:
				is_any_option_correct = True

		if not is_any_option_correct:
			return{
				'error':True,
				'message': 'Minimum 1 option should be correct for the question.'
			}
		question = Questions.create_question(args)
		return {'data':question}


@api.route('/<question_id>')
class Question(Resource):

	get_response = api.model('GET_questions_id_response', {
		'error': fields.Boolean(default=False),
		'data': fields.Nested(question_obj),
		'message': fields.String
	})


	put_response = api.model('PUT_questions_id_response', {
		'error': fields.Boolean(default=False),
		'message': fields.String,
		'invalid_option_ids': fields.List(fields.Integer),
		'data' : fields.Nested(question_obj)
	})

	put_payload_model = question_obj

	QUESTIONS_UPDATE_DESCRIPTION = """
		Possible values of different JSON keys which can be passed:

			- 'id': Id of the Question in Integer,
			- 'type': ['MCQ', 'Integer Answer'],
			- 'topic': ['BASIC_MATH', 'ABSTRACT_REASONING', 'NON_VERBAL_LOGICAL_REASONING'],
			- 'difficulty': ['Easy', 'Medium', 'Hard'],
			- 'en_text': Question string in English,
			- 'hi_text': Question string in Hindi,

			- 'options': This will contain an array of options. Every object in the array will look like:
				[
				    {
						'id': Id of the Option in Integer,
				        'en_text': 'Option in English',
				        'hi_text': 'Option in Hindi',
				        'correct': True  if it's correct option for the question else False
				    }
				]

			RETURN fields:

			- 'invalid_option_ids' : [ 1, 4, 11, 112, 131, 142, 122] Invalid options ids.
	"""


	@api.marshal_with(get_response)
	def get(self, question_id):
		# return a single question
		question = Questions.query.filter_by(id = question_id).first()

		# find question or error
		if not question:
			return {
				'error': True,
				'message': "Question with given ID doesn't exist."
			}

		return { 'data': question }

	@api.doc(description=QUESTIONS_UPDATE_DESCRIPTION)
	@api.marshal_with(put_response)
	@api.expect(put_payload_model)
	def put(self, question_id):
		args = api.payload

		# find question or error
		question = Questions.query.filter_by(id = question_id).first()
		if not question:
			return {
				'error':True,
				'message': "Question id doesn't exist",
			}

		# In the PUT request the IDs of the options being edited need to be mentioned.
		# Check if any wrong option IDs are attached. If yes, then throw an error.
		wrong_option_ids = check_option_ids(question, args)
		if wrong_option_ids:
			return {
				'error':True,
				'message':'Incorrect option_id for the question',
				'invalid_option_ids': wrong_option_ids
			}

		# Update the question
		question.update_question(args)

		return { 'data': question }
