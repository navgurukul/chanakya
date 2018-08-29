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
from chanakya.src.helpers.response_objects import question_obj
from chanakya.src.helpers.task_helpers import parse_question_dict
from chanakya.src.helpers.file_uploader import upload_file_to_s3, FileStorageArgument




@api.route('/question/upload_file')
class UploadQuestionImage(Resource):
	image_parser = reqparse.RequestParser(argument_class=FileStorageArgument)
	image_parser.add_argument('image', required=True, type=FileStorage, location='files')

	@api.doc(parser=image_parser)
	def post(self):
		args = self.image_parser.parse_args()
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
	create_question_parser = reqparse.RequestParser()
	create_question_parser.add_argument('hi_question_text', type=str, required=True)
	create_question_parser.add_argument('en_question_text', type=str, required=True)
	create_question_parser.add_argument('difficulty',type=str, choices=[attr.value for attr in app.config['QUESTION_DIFFICULTY']], required=True)
	create_question_parser.add_argument('topic',type=str, choices=[attr.value for attr in app.config['QUESTION_TOPIC']], required=True)
	create_question_parser.add_argument('type',type=str, choices=[attr.value for attr in app.config['QUESTION_TYPE']], required=True)

	create_question_parser.add_argument('option_en_text', type=str, action='append', required=True, help='options in ENGLISH')
	create_question_parser.add_argument('option_hi_text', type=str, action='append', required=True, help='options in HINDI')
	create_question_parser.add_argument('correct_answers', type=str, action='append', required=True, help='Add option number for answer Example: 1 for the first options and same for 2,3,4,...')

	@api.marshal_with(question_obj)
	@api.doc(parser=create_question_parser)
	def post(self):

		#get the values out of the RequestParser
		args = self.create_question_parser.parse_args()

		options_in_en = args.get('option_en_text')
		options_in_hi = args.get('option_hi_text')
		question_dict = parse_question_dict(args)

		#create the question
		question = Questions.create_question(question_dict)

		return question




@api.route('/question/')
class AllQuestions(Resource):
	questions_list_obj = api.model('questions_list', {
		'questions_list' : fields.List(fields.Nested(question_obj))
	})

	@api.marshal_with(questions_list_obj)
	def get(self):
		questions_list = Questions.query.all()
		return {
				"questions_list":questions_list
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
