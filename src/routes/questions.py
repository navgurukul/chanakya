from flask_restplus import Resource, reqparse, abort, marshal_with, fields
from chanakya.src import app, api, db
from io import BytesIO
from chanakya.src.models import (
					Student,
					IncomingCalls,
					StudentContact,
					Questions
			)
from werkzeug.datastructures import FileStorage
from chanakya.src.helpers.response_objects import question_obj, questions_list_obj
from chanakya.src.helpers.task_helpers import render_pdf_phantomjs
from chanakya.src.helpers.file_uploader import upload_file_to_s3, FileStorageArgument
from chanakya.src.helpers.validators import check_option_ids


@api.route('/question/upload_file')
class UploadQuestionImage(Resource):

	post_parser = reqparse.RequestParser(argument_class=FileStorageArgument)
	post_parser.add_argument('image', required=True, type=FileStorage, location='files')

	@api.doc(parser=post_parser)
	def post(self):

		args = self.post_parser.parse_args()

		# upload to s3
		image = args['image']
		image_url = upload_file_to_s3(image, app.config['S3_QUESTION_IMAGES_BUCKET'])

		return {'image_url': image_url}


@api.route('/questions')
class QuestionList(Resource):

	get_response = api.model('GET_questions_list', {
		'questions_list' : fields.List(fields.Nested(question_obj))
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

	post_response = question_obj

	@api.marshal_with(get_response)
	def get(self):
		questions_list = Questions.query.all()
		return {
			"questions_list":questions_list
		}

	@api.marshal_with(post_response)
	@api.expect(post_payload_model)
	@api.doc(description=CREATE_QUESTION)
	def post(self):
		args = api.payload
		# create the question
		question = Questions.create_question(args)
		return question


@api.route('/questions/<question_id>')
class Question(Resource):
	get_response = api.model('GET_questions_id_response', {
		'error': fields.Boolean(default=False),
		'question_data': fields.Nested(question_obj),
		'message': fields.String
	})


	put_response = api.model('PUT_questions_id_response', {
		'error': fields.Boolean(default=False),
		'message': fields.String,
		'invalid_option_ids': fields.List(fields.Integer),
		'question' : fields.Nested(question_obj)
	})

	put_model = question_obj

	@api.marshal_with(get_response)
	def get(self, question_id):
		# return a single question
		question = Questions.query.filter_by(id = question_id).first()

		# if question_id is wrong or doesn't exist
		if not question:
			return {
				'error': True,
				'message': "question_id doesn't exist!"
			}

		return {
			'question_data': question
		}


	@api.marshal_with(put_response)
	@api.expect(put_model, validate=True)
	def put(self, question_id):
		args = api.payload
		question = Questions.query.filter_by(id = question_id).first()

		if not question:
			return {
				'error':True,
				'message': "Question id doesn't exist",
			}

		# if options id are not attached to the question
		wrong_option_ids = check_option_ids(question, args)

		if wrong_option_ids:
			return {
				'error':True,
				'message':'Incorrect option_id for the question',
				'invalid_option_ids': wrong_option_ids
			}

		# question update
		question.update_question(args)

		return {
			'question': question
		}
