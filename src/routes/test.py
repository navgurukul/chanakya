from flask_restplus import Resource, reqparse, fields
from chanakya.src.models import EnrolmentKey, StudentContact, Student, Questions, QuestionAttempts,QuestionSet
from chanakya.src import api, db, app
from datetime import datetime, timedelta

from chanakya.src.helpers.response_objects import (
                enrollment_key_status,
                enrollment_key_validation,
                question_obj,
                questions_list_obj,
                questions_attempts,
                question_set
            )
from chanakya.src.helpers.file_uploader import upload_pdf_to_s3, FileStorageArgument
from werkzeug.datastructures import FileStorage
from chanakya.src.helpers.validators import check_enrollment_key, check_question_ids, check_question_is_in_set
from chanakya.src.helpers.routes_descriptions import (
                VALIDATE_ENROLMENT_KEY_DESCRIPTION,
                PERSONAL_DETAILS_DESCRIPTION,
                MORE_STUDENT_DETAIL
            )
from chanakya.src.helpers.task_helpers import render_pdf_phantomjs, get_attempts, get_dataframe_from_csv


#Validation for the enrollment key
@api.route('/test/validate_enrolment_key')
class EnrollmentKeyValidtion(Resource):
    get_parser = reqparse.RequestParser()
    get_parser.add_argument('enrollment_key', type=str, required=True, help='The enrolment key you want to validate.')

    @api.marshal_with(enrollment_key_validation)
    @api.doc(parser=get_parser, description=VALIDATE_ENROLMENT_KEY_DESCRIPTION)
    def get(self):
        args = self.get_parser.parse_args()
        enrollment_key = args.get('enrollment_key', None)

        result, enrollment = check_enrollment_key(enrollment_key)
        return result



@api.route('/test/personal_details')
class PersonalDetailSubmit(Resource):
    post_parser = reqparse.RequestParser()
    post_parser.add_argument('enrollment_key', type=str, required=True, location='json')
    post_parser.add_argument('name', type=str, required=True, location='json')
    post_parser.add_argument('dob', help='DD-MM-YYYY', type=lambda x: datetime.strptime(x, "%d-%m-%Y"), required=True, location='json')
    post_parser.add_argument('mobile_number', type=str, required=True, location='json')
    post_parser.add_argument('gender', type=str, choices=[ attr.value for attr in app.config['GENDER']], required=True, location='json')

    @api.marshal_with(enrollment_key_status)
    @api.doc(parser=post_parser, description=PERSONAL_DETAILS_DESCRIPTION)
    def post(self):

        args = self.post_parser.parse_args()
        args['gender'] = app.config['GENDER'](args['gender'])
        # Enrollment Key
        mobile_number = args['mobile_number']
        enrollment_key = args['enrollment_key']

        # check the validity of enrollment key
        result, enrollment = check_enrollment_key(enrollment_key)
        # student record shall be updated only when the key is not used
        if result['valid'] and result['reason'] == 'NOT_USED':
            # updating student data
            student_id = enrollment.student_id

            student = Student.query.filter_by(id=student_id).first()
            student.update_data(args)

            # creating student contact record
            student_contact = StudentContact.create(contact=mobile_number, student_id=student_id)
            return {
                'success':True,
                'enrollment_key_status': result['reason']
            }
        # when the key is used but somehow student went to the this route instead of test
        elif result['valid'] and result['reason'] == 'ALREADY_IN_USED':
            return {
                'success':True,
                'enrollment_key_status': result['reason']
            }
        # when the key is not valid
        return {
            'success':False,
            'enrollment_key_status': result['reason'],
        }



@api.route('/test/start_test')
class TestStart(Resource):
    get_parser = reqparse.RequestParser()
    get_parser.add_argument('enrollment_key', required=True, type=str)

    start_test_response = api.model('start_test',{
        'error':fields.Boolean(default=False),
        'questions':fields.List(fields.Nested(question_obj)),
        'enrollment_key_validation': fields.Boolean(default=True)
    })

    @api.marshal_with(start_test_response)
    @api.doc(parser=get_parser)
    def get(self):
        args = self.get_parser.parse_args()

        # check the enrollment key
        enrollment_key =  args.get('enrollment_key')
        result, enrollment = check_enrollment_key(enrollment_key)

        # if enrollment doesn't exist or expired
        if not result['valid']:
            return {
                'error':True,
                'enrollment_key_validation':False
            }

        elif result['valid'] and result['reason'] == 'ALREADY_IN_USED':
            questions = enrollment.extract_question_from_set()
        else:
            # start the test and send the questions generated randomly
            enrollment.start_test()
            question_set, questions = QuestionSet.create_new_set()
            enrollment.question_set_id = question_set.id
            db.session.add(enrollment)
            db.session.commit()

        return {
            'questions':questions
        }



@api.route('/test/end_test')
class TestEnd(Resource):
    end_test_response =  api.model('end_test_response',{
        'error': fields.Boolean(default=False),
        'enrollment_key_valid': fields.Boolean(default=True),
        'success': fields.Boolean(default=False),
        'invalid_question_ids': fields.List(fields.Integer)
    })

    @api.expect(questions_attempts, validate=True)
    @api.marshal_with(end_test_response)
    def post(self):

        args = api.payload

        # check the enrollment key
        enrollment_key =  args.get('enrollment_key')
        result, enrollment = check_enrollment_key(enrollment_key)

        # if enrollment doesn't exist or expired
        if not result['valid']:
            return {
                'error':True,
                'enrollment_key_valid':False
            }
        #add questions to db
        questions_attempted = args.get('question_attempted')
        # is_question_ids_correct = check_question_ids(questions_attempted)
        wrong_question_ids = check_question_ids(questions_attempted)

        if wrong_question_ids:
            return {
                'error':True,
                'enrollment_key_valid':True,
                'invalid_question_ids': wrong_question_ids
            }
        wrong_question_ids = check_question_is_in_set(enrollment, questions_attempted)

        # if not question_is_in_set:
        if wrong_question_ids:
            return {
                'error':True,
                'enrollment_key_valid':True,
                'invalid_question_ids': wrong_question_ids
            }

        QuestionAttempts.create_attempts(questions_attempted, enrollment)
        enrollment.end_test()

        return {
            'success': True
        }

@api.route('/test/extra_details')
class MoreStudentDetail(Resource):
    more_student_detail_post = api.model('more_detail', {
        'enrollment_key':fields.String(required=True),
        'caste': fields.String(enum=[attr.value for attr in app.config['CASTE']], required=True),
        'religion': fields.String(enum=[attr.value for attr in app.config['RELIGION']], required=True),
        'monthly_family_member': fields.Integer(required=True),
        'total_family_member': fields.Integer(required=True),
        'family_member_income_detail': fields.String(required=True)
    })

    more_student_detail_response = api.model('more_detail_response', {
        'success': fields.Boolean(default=False),
        'error':fields.Boolean(default=False),
        'message':fields.String
    })
    @api.doc(description=MORE_STUDENT_DETAIL)
    @api.marshal_with(more_student_detail_response)
    @api.expect(more_student_detail_post, validate=True)
    def post(self):

        args = api.payload
        enrollment_key = args.get('enrollment_key')

        result, enrollment = check_enrollment_key(enrollment_key)

        # if the enrollment_key does't exist
        if not result['valid'] and result['reason'] == 'DOES_NOT_EXIST':
            return {
                'error':True,
                'message':"KEY_DOESN'T_EXIST"
            }
        # if the key is expired it means has given examination and can fill the more details
        if not result['valid'] and result['reason'] == 'EXPIRED':
            student_id = enrollment.student_id
            student = Student.query.get(student_id)
            student.update_data(args)
            return {
                'success':True,
                'message':"UPDATED_DATA"
            }

        # when the key is not used to give any test
        return {
            'error':True,
            'message':"KEY_IS_NOT_USED"
        }

@api.route('/test/offline_paper')
class OfflinePaperList(Resource):
    offline_paper_post = api.model('offline_paper_post', {
        'number_sets':fields.Integer(required=True),
        'partner_name':fields.String(required=True)
    })

    offline_paper_response = api.model('offline_paper_response', {
        'error': fields.Boolean(default=False),
        'question_sets':fields.List(fields.Nested(question_set))
    })

    @api.marshal_with(offline_paper_response)
    @api.expect(offline_paper_post, validate=True)
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
                question_pdf = render_pdf_phantomjs('question_pdf.html', **locals())
                answer_pdf = render_pdf_phantomjs('answer_pdf.html', **locals())

                #s3 method that upload the binary file
                question_pdf_s3_url = upload_pdf_to_s3(string=question_pdf)
                answer_pdf_s3_url = upload_pdf_to_s3(string=answer_pdf)

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
            'question_sets': set_list
        }

    @api.marshal_with(offline_paper_response)
    def get(self):

        set_instance = QuestionSet.query.filter(QuestionSet.partner_name != None).all()
        return {
            'question_sets': set_instance
        }


@api.route('/test/offline_paper/<id>')
class OfflinePaper(Resource):

    set_response = api.model('set_response', {
        'error': fields.Boolean(default=False),
        'set': fields.Nested(question_set),
        'message':fields.String,
    })

    @api.marshal_with(set_response)
    def get(self, id):

        set_instance = QuestionSet.query.filter_by(id=id).first()
        if set_instance:
            return {
                'set': set_instance
            }

        return {
            'data':'All Detail Submitted'
        }

@api.route('/test/offline_paper/<id>/upload_results')
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
		csv_url = upload_file_to_s3(csv)

		return {'csv_url': csv_url}


@api.route('/test/offline_paper/<id>/add_results')
class OfflineCSVProcessing(Resource):
    csv_processing_post = api.model('csv_processing', {
        'csv_url': fields.String
    })

    @api.expect(csv_processing_post, validate=True)
    def post(self, id):
        args = api.payload

        student_rows = get_dataframe_from_csv(args)
        for row in student_rows:
            student_data = {}

            student_data['name'] =  row.get('Name')
            if not student_data['name']:
                return {
                    'error':True
                }

            student_data['gender'] =  app.config['GENDER'](row.get('Gender').upper())
            student_data['dob'] =  datetime.strptime(row.get('Date of Birth'), '%d-%m-%Y')

            stage =  'PVC'

            # student_data['religion'] =  app.config['RELIGION'](row.get('Religon'))
            # student_data['caste'] =  app.config['CASTE'](row.get('Caste'))
            # student_data['state'] =  row.get('State')

            main_contact = row.get('Mobile')
            mobile = row.get('Potential Name')

            if not mobile or not main_contact:
                return {
                    'error': True
                }

            set = int(row.get('Set'))
            set_instance = QuestionSet.query.get(set)

            if not set_instance:
                return {
                    'error': True
                }

            set_id = set_instance.id

            # creating the student, student_contact and an enrollment_key for the student with set_id
            student, enrollment = Student.offline_student_record(stage, student_data, main_contact, mobile, set_id)

            attempts = get_attempts(row, enrollment) # this get all the attempts made by student

            QuestionAttempts.create_attempts(attempts, enrollment) #storing the attempts to the database

            enrollment.calculate_test_score() #calculating the score of the student

        return {
            'success':True
        }
