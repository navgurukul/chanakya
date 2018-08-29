from flask_restplus import Resource, reqparse, fields
from chanakya.src.models import EnrolmentKey, StudentContact, Student, Questions
from chanakya.src import api, db, app
from datetime import datetime, timedelta

from chanakya.src.helpers.response_objects import (
                enrollment_key_status,
                enrollment_key_validation,
                question_obj,
                questions_list_obj
            )
from chanakya.src.helpers.validators import check_enrollment_key
from chanakya.src.helpers.routes_descriptions import (
                VALIDATE_ENROLMENT_KEY_DESCRIPTION,
                PERSONAL_DETAILS_DESCRIPTION
            )



#Validation for the enrollment key
@api.route('/test/validate_enrolment_key')
class EnrollmentKeyValidtion(Resource):
    enrolment_validation_parser = reqparse.RequestParser()
    enrolment_validation_parser.add_argument('enrollment_key', type=str, required=True, help='The enrolment key you want to validate.')

    @api.marshal_with(enrollment_key_validation)
    @api.doc(parser=enrolment_validation_parser, description=VALIDATE_ENROLMENT_KEY_DESCRIPTION)
    def get(self):
        args = self.enrolment_validation_parser.parse_args()
        enrollment_key = args.get('enrollment_key', None)

        result, enrollment = check_enrollment_key(enrollment_key)
        return result


@api.route('/test/personal_details')
class PersonalDetailSubmit(Resource):
    enrolment_validation_parser = reqparse.RequestParser()
    enrolment_validation_parser.add_argument('enrollment_key', type=str, required=True, help='The enrolment key you want to validate.')

    personal_detail_parser = reqparse.RequestParser()
    personal_detail_parser.add_argument('enrollment_key', type=str, required=True)
    personal_detail_parser.add_argument('name', type=str, required=True)
    personal_detail_parser.add_argument('dob', help='DD-MM-YYYY', type=lambda x: datetime.strptime(x, "%d-%m-%Y"), required=True)
    personal_detail_parser.add_argument('mobile_number', type=str, required=True)
    personal_detail_parser.add_argument('gender', type=str, choices=[ attr.value for attr in app.config['GENDER']], required=True)

    @api.marshal_with(enrollment_key_status)
    @api.doc(parser=personal_detail_parser, description=PERSONAL_DETAILS_DESCRIPTION)
    def post(self):
        args = self.personal_detail_parser.parse_args()

        # student data
        student_data = {}
        student_data['name'] = args.get('name' , None)
        student_data['dob'] = args.get('dob' , None)

        #enum
        gender = args.get('gender' ,None)
        student_data['gender'] = app.config['GENDER'](gender)

        # student_contact data
        mobile_number = args.get('mobile_number' , None)

        # enrollmentkey
        enrollment_key = args.get('enrollment_key', None)

        # check the validity of enrollment key
        result, enrollment = check_enrollment_key(enrollment_key)

        # student record shall be updated only when the key is not used
        if result['valid'] and result['reason'] == 'NOT_USED':
            # updating student data
            student_id = enrollment.student_id
            student = Student.query.filter_by(id=student_id).first()
            student.update_data(student_data)

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
    enrollment_key_parser = reqparse.RequestParser()
    enrollment_key_parser.add_argument('enrollment_key', required=True, type=str)

    start_test_response = api.model('start_test',{
        'error':fields.Boolean(default=False),
        'questions':fields.Nested(questions_list_obj),
        'enrollment_key_validation': fields.Boolean(default=True)
    })

    @api.marshal_with(questions_list_obj)
    @api.doc(parser=enrollment_key_parser)
    def get(self):
        args = self.enrollment_key_parser.parse_args()
        # TODO: check the enrollment key
        enrollment_key =  args.get('enrollment_key')
        result, enrollment = check_enrollment_key(enrollment_key)

        # TODO: what to do if it doesn't exist or expired
        if not result['valid']:
            return {
                'error':True,
                'enrollment_key_validation':False
            }

        # TODO: what to do if it is already in use

        # TODO: start the test and send the questions generated randomly
        current_datetime = datetime.now()
        enrollment.test_start_time = current_datetime
        enrollment.test_end_time = current_datetime + timedelta(seconds=app.config['TEST_DURATION'])
        db.session.add(enrollment)
        db.session.commit()
        questions = Questions.get_random_question_set()

        return {
            'questions':questions
        }

@api.route('/test/end_test')
class TestEnd(Resource):
    def post(self):
        return {
        'data': 'Test end and question submitted'
        }

@api.route('/test/extra_details')
class MoreDetail(Resource):
    def post(self):
        return {
        'data':'All Detail Submitted'
        }
