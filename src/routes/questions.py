from flask_restplus import Resource, reqparse, abort, marshal_with
from chanakya.src import app, api, db
from io import BytesIO
from chanakya.src.models import (
					Student,
					IncomingCalls,
					StudentContact,
					Questions
			)
from werkzeug.datastructures import FileStorage
from chanakya.src.helpers import question_obj
from chanakya.src.helpers import (
				parse_question_args_to_dict,
	 			get_the_questions_as_list,
				get_question_as_dict,
				upload_file_to_s3,
				FileStorageArgument
			)



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
	create_question_parser.add_argument('answer', type=str, required=True, help='For MCQ type the option For example: option1, option2')

	create_question_parser.add_argument('option1_en_text', type=str, required=False)
	create_question_parser.add_argument('option1_hi_text', type=str, required=False)

	create_question_parser.add_argument('option2_en_text', type=str, required=False)
	create_question_parser.add_argument('option2_hi_text', type=str, required=False)

	create_question_parser.add_argument('option3_en_text', type=str, required=False)
	create_question_parser.add_argument('option3_hi_text', type=str, required=False)

	create_question_parser.add_argument('option4_en_text', type=str, required=False)
	create_question_parser.add_argument('option4_hi_text', type=str, required=False)

	@marshal_with(question_obj)
	@api.doc(parser=create_question_parser)
	def post(self):

		#get the values out of the RequestParser
		args = self.create_question_parser.parse_args()
		question = parse_question_args_to_dict(args)
		#create the question
		questions = Questions.add_question(question)

		return {
			'question'.question
		}



@api.route('/question/')
class AllQuestions(Resource):
	def get(self):
		questions_list = get_the_questions_as_list()
		return {
				"question_list":questions_list
			}


@api.route('/questions/<question_id>')
class SingleQuestion(Resource):
	def get(self, question_id):
		# return a single question
		question = Questions.query.filter_by(id = question_id).first()
		if not question:
			return {
				'error': True,
				'message': "question_id doesn't exist!"
			}
		else:
			question_data = get_question_as_dict(question)
			return {
				'question_data': question_data
			}
