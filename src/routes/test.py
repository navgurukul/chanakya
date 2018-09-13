from flask_restplus import Resource, reqparse
from chanakya.src.models import EnrolmentKey
from chanakya.src import api, db
from chanakya.src import app

from chanakya.src.helpers.response_objects import enrollment_key_validation
from chanakya.src.helpers.validators import check_enrollment_key
from chanakya.src.helpers.routes_descriptions import VALIDATE_ENROLMENT_KEY_DESCRIPTION

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
    def post(self):
        return {
        'data':'Detail Submitted'
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
