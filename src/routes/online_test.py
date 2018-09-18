from flask_restplus import Resource, reqparse, fields
from chanakya.src.models import EnrolmentKey, StudentContact, Student, Questions, QuestionAttempts,QuestionSet
from chanakya.src import api, db, app
from datetime import datetime, timedelta

from chanakya.src.helpers.response_objects import (
                question_obj,
                questions_list_obj,
                question_set
            )
from chanakya.src.helpers.file_uploader import upload_pdf_to_s3, FileStorageArgument
from werkzeug.datastructures import FileStorage
from chanakya.src.helpers.validators import check_enrollment_key, check_question_ids, check_question_is_in_set
from chanakya.src.helpers.task_helpers import render_pdf_phantomjs, get_attempts, get_dataframe_from_csv


#Validation for the enrollment key
@api.route('/test/validate_enrolment_key')
class EnrollmentKeyValidtion(Resource):

    get_parser = reqparse.RequestParser()
    get_parser.add_argument('enrollment_key', type=str, required=True)

    get_response = api.model('GET_validate_enrolment_key_response',{
        'valid': fields.Boolean,
        'reason': fields.String
    })

    VALIDATE_ENROLMENT_KEY_DESCRIPTION = """
    Response would comprise of two JSON keys. `valid` & `reason`.
    Here are there possible values.

    'valid': {
        True: already in use or not used till yet,
        False: expired or doesn't exist
    }
    reason: {
        'NOT_USED' : The key is not used and but has been generated,
        'DOES_NOT_EXIST' : The key have not been generated or doesn't exist in the platform,
        'ALREADY_IN_USED' : A Student is already using to give the test,
        'EXPIRED' : Time to generate a new key
    }
    """

    @api.marshal_with(get_response)
    @api.doc(parser=get_parser, description=VALIDATE_ENROLMENT_KEY_DESCRIPTION)
    def get(self):
        args = self.get_parser.parse_args()
        enrollment_key = args.get('enrollment_key', None)

        result, enrollment = check_enrollment_key(enrollment_key)
        return result


@api.route('/test/personal_details')
class PersonalDetailSubmit(Resource):

    post_payload_model = api.model('POST_personal_details', {
        'enrollment_key': fields.String(required=True),
        'name': fields.String(required=True),
        'mobile_number': fields.String(required=True),
        'dob': fields.Date(required=True),
        'gender': fields.String(required=True, choices=[attr.value for attr in app.config['GENDER']])
    })

    post_response = api.model('POST_enrollment_key_status_response', {
        'success': fields.Boolean,
        'enrollment_key_status':fields.String
    })

    PERSONAL_DETAILS_DESCRIPTION = """
    Response will comprise of two JSON keys. `success` and `enrollment_key_status`
    Possible values of both are explained below.
    'success': {
        True : when the data is added,
        False : when we can't data can't be added
    }
    'enrollment_key_status':{
        'NOT_USED' : The key is not used and but has been generated,
        'DOES_NOT_EXIST' : The key have not been generated or doesn't exist in the platform,
        'ALREADY_IN_USED' : A Student is already using to give the test but you can't post the data to it,
        'EXPIRED' : Time to generate a new key
    }
    """

    @api.marshal_with(post_response)
    @api.doc(description=PERSONAL_DETAILS_DESCRIPTION)
    @api.expect(post_payload_model)
    def post(self):
        # parse the arguments
        args = api.payload
        args['gender'] = app.config['GENDER'](args['gender'])
        mobile_number = args['mobile_number']
        enrollment_key = args['enrollment_key']

        # check the validity of enrollment key
        result, enrollment = check_enrollment_key(enrollment_key)

        # student record shall be updated only when the key is not used and valid
        if result['valid'] and result['reason'] == 'NOT_USED':

            # updating student data
            student_id = enrollment.student_id
            student = Student.query.filter_by(id=student_id).first()
            student.update_data(args, [mobile_number])

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

    get_response = api.model('GET_start_test_response',{
        'error':fields.Boolean(default=False),
        'questions':fields.List(fields.Nested(question_obj)),
        'enrollment_key_validation': fields.Boolean(default=True)
    })

    @api.marshal_with(get_response)
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

        # if `ALREADY_IN_USED` means a question set associated with the ID has
        # already been generated. Then just get that set and return it.
        elif result['valid'] and result['reason'] == 'ALREADY_IN_USED':
            question_set = enrollment.question_set
            questions = question_set.get_questions()

        # otherwise if the enrolment key has never been used then a new question
        # set needs to be created and served.
        else:
            # start the test and send the questions generated randomly
            question_set, questions = enrollment.get_question_set()

        return { 'questions':questions }


@api.route('/test/end_test')
class TestEnd(Resource):

    post_response =  api.model('POST_end_test_response',{
        'error': fields.Boolean(default=False),
        'enrollment_key_valid': fields.Boolean(default=True),
        'success': fields.Boolean(default=False),
        'invalid_question_ids': fields.List(fields.Integer)
    })

    # questions attempted
    question_attempt = api.model('POST_end_test_question_attempt',{
        'question_id': fields.Integer(required=True),
        'selected_option_id': fields.Integer(required=False),
        'answer': fields.String(required=False)
    })

    post_payload_model = api.model('POST_end_test', {
        'enrollment_key': fields.String(required=True),
        'question_attempted': fields.List(fields.Nested(question_attempt), required=True)
    })

    @api.expect(post_payload_model)
    @api.marshal_with(post_response)
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

        # Check if only valid question IDs are there
        questions_attempted = args.get('question_attempted')
        wrong_question_ids = check_question_ids(questions_attempted)
        if wrong_question_ids:
            return {
                'error':True,
                'enrollment_key_valid':True,
                'invalid_question_ids': wrong_question_ids
            }

        # check if the ids given by the user are among his set only
        wrong_question_ids = check_question_is_in_set(enrollment, questions_attempted)
        if wrong_question_ids:
            return {
                'error':True,
                'enrollment_key_valid':True,
                'invalid_question_ids': wrong_question_ids
            }

        # Create attempts in the DB
        QuestionAttempts.create_attempts(questions_attempted, enrollment)
        enrollment.end_test()

        return {
            'success': True
        }


@api.route('/test/extra_details')
class MoreStudentDetail(Resource):

    post_payload_model = api.model('POST_extra_details', {
        'enrollment_key':fields.String(required=True),
        'caste': fields.String(enum=[attr.value for attr in app.config['CASTE']], required=False),
        'religion': fields.String(enum=[attr.value for attr in app.config['RELIGION']], required=False),
        'monthly_family_member': fields.Integer(required=False),
        'total_family_member': fields.Integer(required=False),
        'family_member_income_detail': fields.String(required=False)
    })

    post_response = api.model('POST_extra_detail_response', {
        'success': fields.Boolean(default=False),
        'error':fields.Boolean(default=False)
    })

    @api.marshal_with(post_response)
    @api.expect(post_payload_model)
    def post(self):

        args = api.payload
        enrollment_key = args.get('enrollment_key')

        result, enrollment = check_enrollment_key(enrollment_key)

        # if the enrollment_key does't exist
        if result['reason'] == 'DOES_NOT_EXIST':
            return {
                'error':True,
                'message':"KEY_DOESN'T_EXIST"
            }

        # update the data of the student
        student = enrollment.student
        student.update_data(args)

        return { 'success':True }
