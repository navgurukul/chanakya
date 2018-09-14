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
from chanakya.src.helpers.response_objects import question_obj, create_question
from chanakya.src.helpers.task_helpers import parse_question_dict
from chanakya.src.helpers.file_uploader import upload_file_to_s3, FileStorageArgument
from chanakya.src.helpers.routes_descriptions import CREATE_QUESTION



@api.route('/question/upload_file')
class UploadQuestionImage(Resource):
	post_parser = reqparse.RequestParser(argument_class=FileStorageArgument)
	post_parser.add_argument('image', required=True, type=FileStorage, location='files')

	@api.doc(parser=post_parser)
	def post(self):
		args = self.post_parser.parse_args()
		image = args['image']

		# check image file extension
		extension = image.filename.rsplit('.', 1)[1].lower()
		if '.' in image.filename and not extension in app.config['ALLOWED_EXTENSIONS']:
			abort(400, message="File extension is not one of our supported types.")

		# upload to s3
		image_url = upload_file_to_s3(image)

		return {'image_url': image_url}

# @Amar: This should be deleted and moved to `post` method in QuestionList class.
@api.route('/question/create')
class CreateQuestion(Resource):

	@api.marshal_with(question_obj)
	@api.expect(create_question, validate=True)
	@api.doc(description=CREATE_QUESTION)
	def post(self):

		args = api.payload

		#create the question
		question = Questions.create_question(args)
		return question

@api.route('/question')
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

	def post(self):
		return "@Amar: The question should be created here."


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

	def put(self):
		return "@Amar: The question should be edited here."
