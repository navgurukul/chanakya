from flask_restplus import Resource, reqparse
from datetime import datetime
from chanakya.src.helpers.response_objects import enrollment_key_status, enrollment_key_validation
from chanakya.src.helpers.validators import check_enrollment_key
from chanakya.src.helpers.routes_descriptions import VALIDATE_ENROLMENT_KEY_DESCRIPTION,PERSONAL_DETAILS_DESCRIPTION

from chanakya.src.models import EnrolmentKey
from chanakya.src import api, db
from chanakya.src import app

#Validation for the enrollmelnt key
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
    def get(self):
        return {
        'data':'Test Question Sent'
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
