
from datetime import datetime
from flask_restplus import Resource, reqparse, fields, Namespace

from werkzeug.datastructures import FileStorage

from chanakya.src import db, app
from chanakya.src.models import Student, QuestionAttempts, QuestionSet

from chanakya.src.helpers.response_objects import question_set
from chanakya.src.helpers.file_uploader import upload_file_to_s3, FileStorageArgument
from chanakya.src.helpers.task_helpers import render_pdf_phantomjs, get_attempts, get_dataframe_from_csv

from chanakya.src.google_sheet_sync.sync_google_sheet import SyncGoogleSheet


api = Namespace('offline_test', description='Handle complete offline test of students')

@api.route('/offline_paper')
class OfflinePaperList(Resource):
    post_payload_model = api.model('POST_offline_paper', {
        'number_sets':fields.Integer(required=True),
        'partner_name':fields.String(required=True)
    })

    offline_paper_response = api.model('offline_paper_response', {
        'error': fields.Boolean(default=False),
        'data':fields.List(fields.Nested(question_set))
    })

    @api.marshal_with(offline_paper_response)
    @api.expect(post_payload_model)
    def post(self):
        args = api.payload

        number_sets = args.get('number_sets')
        partner_name = args.get('partner_name')

        set_list = []

        for i in range(number_sets):
            try:
                # generate the random sets and get question
                set_instance, questions = QuestionSet.create_new_set(partner_name)

                # render pdf
                question_pdf = render_pdf_phantomjs('question_pdf.bkp.html', set_instance=set_instance, questions=questions)
                answer_pdf = render_pdf_phantomjs('answer_pdf.html', set_instance=set_instance, questions=questions)

                #s3 method that upload the binary file
                question_pdf_s3_url = upload_file_to_s3(bucket_name = app.config['S3_QUESTION_IMAGES_BUCKET'], string=question_pdf, filename_extension='pdf')
                answer_pdf_s3_url = upload_file_to_s3(bucket_name = app.config['S3_QUESTION_IMAGES_BUCKET'], string=answer_pdf,   filename_extension='pdf')

                print(question_pdf_s3_url)
                print(answer_pdf_s3_url)

                # # update url of question_set
                set_instance.question_pdf_url = question_pdf_s3_url
                set_instance.answer_pdf_url = answer_pdf_s3_url
                db.session.add(set_instance)
                db.session.commit()

                set_list.append(set_instance)
            except Exception as e:
                raise e

        print(set_list)
        # return each and every question_set
        return {
            'data': set_list
        }

    @api.marshal_with(offline_paper_response)
    def get(self):

        set_instance = QuestionSet.query.filter(QuestionSet.partner_name != None).all()
        if set_instance:
            return {
                'data': set_instance
            }
        return{
            'error':True,
            'message':'No set generated for any partner till yet.'
        }

@api.route('/offline_paper/<id>')
class OfflinePaper(Resource):

    get_response = api.model('GET_offline_paper_id_response', {
        'error': fields.Boolean(default=False),
        'data': fields.Nested(question_set),
        'message':fields.String,
    })

    @api.marshal_with(get_response)
    def get(self, id):

        set_instance = QuestionSet.query.filter_by(id=id).first()
        if set_instance:
            return {
                'data': set_instance
            }

        return {
            'message':"Set doesn't exist",
            'error':True
        }

@api.route('/offline_paper/<id>/upload_results')
class OfflineCSVUpload(Resource):
	post_parser = reqparse.RequestParser(argument_class=FileStorageArgument)
	post_parser.add_argument('partner_csv', required=True, type=FileStorage, location='files')

	@api.doc(parser=post_parser)
	def post(self, id):
		args = self.post_parser.parse_args()
		csv = args.get('partner_csv')

		# check image file extension
		extension = csv.filename.rsplit('.', 1)[1].lower()
		if '.' in csv.filename and not extension == 'csv':
			abort(400, message="File extension is not one of our supported types.")

		# upload to s3
		csv_url = upload_file_to_s3(bucket_name=app.config['S3_QUESTION_IMAGES_BUCKET'], file=csv)

		return {'csv_url': csv_url}


@api.route('/offline_paper/<id>/add_results')
class OfflineCSVProcessing(Resource):
    post_payload_model = api.model('POST_add_results', {
        'csv_url': fields.String
    })

    post_response = api.model('POST_add_results_response', {
        'error':fields.Boolean(default=False),
        'success':fields.Boolean(default=False),
        'message':fields.String
    })
    @api.expect(post_payload_model, validate=True)
    def post(self, id):
        args = api.payload

        student_rows = get_dataframe_from_csv(args.get('csv_url'))
        for row in student_rows:
            student_data = {}
            stage =  'PVC'

            student_data['name'] =  row.get('Name')
            student_data['gender'] =  app.config['GENDER'](row.get('Gender').upper())
            student_data['dob'] =  datetime.strptime(row.get('Date of Birth'), '%d-%m-%Y')
            student_data['religion'] =  app.config['RELIGION'](row.get('Religon'))
            student_data['caste'] =  app.config['CASTE'](row.get('Caste'))
            # student_data['state'] =  row.get('State')

            main_contact = row.get('Mobile')
            mobile = row.get('Potential Name')

            set = int(row.get('Set'))
            set_instance = QuestionSet.query.get(set)


            if not student_data['name']:
                return {
                'error':True,
                'message':'Name of all the student must be there in CSV'
                }
            elif not mobile or not main_contact:
                return {
                    'error': True,
                    'message':'Students must provide his contact to get connected'
                }
            elif not set_instance:
                return {
                    'error': True,
                    'message': 'Please check the set id'
                }

            set_id = set_instance.id

            # creating the student, student_contact and an enrollment_key for the student with set_id
            student, enrollment = Student.offline_student_record(stage, student_data, main_contact, mobile, set_instance)

            attempts = get_attempts(row, enrollment) # this get all the attempts made by student

            QuestionAttempts.create_attempts(attempts, enrollment) #storing the attempts to the database

            enrollment.calculate_test_score() #calculating the score of the student

            student = SyncGoogleSheet(student)
        return {
            'success':True
        }
