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
from chanakya.src.helpers.response_objects import question_obj, questions_list_obj, create_question
from chanakya.src.helpers.task_helpers import render_pdf_phantomjs
from chanakya.src.helpers.file_uploader import upload_file_to_s3, FileStorageArgument
from chanakya.src.helpers.routes_descriptions import CREATE_QUESTION
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
	questions_list_obj = api.model('questions_list', {
		'questions_list' : fields.List(fields.Nested(question_obj))
	})

	@api.marshal_with(questions_list_obj)
	def get(self):
		questions_list = Questions.query.all()
		return {
				"questions_list":questions_list
			}

	@api.marshal_with(question_obj)
	@api.expect(create_question, validate=True)
	@api.doc(description=CREATE_QUESTION)
	def post(self):

		args = api.payload

		#create the question
		question = Questions.create_question(args)
		return question



@api.route('/questions/<question_id>')
class Question(Resource):
	single_question = api.model('single_question', {
		'error': fields.Boolean(default=False),
		'question_data': fields.Nested(question_obj),
		'message': fields.String
	})

	@api.marshal_with(single_question)
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


	question_update_obj = api.model('question_update_obj', {
		'error': fields.Boolean(default=False),
		'message': fields.String,
		'invalid_option_ids': fields.List(fields.Integer),
		'question' : fields.Nested(question_obj)
	})

	@api.marshal_with(question_update_obj)
	@api.expect(question_obj, validate=True)
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
