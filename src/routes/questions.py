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
from chanakya.src.helpers.task_helpers import parse_question_dict,render_pdf_phantomjs
from chanakya.src.helpers.file_uploader import upload_file_to_s3, FileStorageArgument


@api.route('/question/upload_file')
class UploadQuestionImage(Resource):
	post_parser = reqparse.RequestParser(argument_class=FileStorageArgument)
	post_parser.add_argument('image', required=True, type=FileStorage, location='files')

	@api.doc(parser=post_parser)
	def post(self):
		args = self.post_parser.parse_args()
		image = args['image']

		# check logo extension
		extension = image.filename.rsplit('.', 1)[1].lower()
		if '.' in image.filename and not extension in app.config['ALLOWED_EXTENSIONS']:
			abort(400, message="File extension is not one of our supported types.")

		# upload to s3
		image_url = upload_file_to_s3(image)

		return {'image_url': image_url}


@api.route('/question/create')
class CreateQuestion(Resource):

	create_question_obj = api.model('create_question_obj',{
		'error': fields.Boolean(default=False),
		'question': fields.Nested(question_obj),
		'message': fields.String
	})

	@api.marshal_with(create_question_obj)
	@api.expect(create_question)
	def post(self):

		#get the values out of the RequestParser
		args = api.payload
		print(args)
		options = args.get('options')
		if not options:
			return {
				'error':True,
				'message': 'Required option'
			}

		#create the question
		question = Questions.create_question(args)

		return {
			'question': question,
			'message': 'QUESTION ADDED'
		}

@api.route('/question/')
class AllQuestions(Resource):

	@api.marshal_with(questions_list_obj)
	def get(self):
		questions_list = Questions.query.all()
		return {
				"questions":questions_list
			}


@api.route('/questions/<question_id>')
class SingleQuestion(Resource):
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
