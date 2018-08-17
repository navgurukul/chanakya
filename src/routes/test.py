from flask_restplus import Resource, reqparse
from chanakya.src.models import EnrolmentKey
from chanakya.src import api, db
from datetime import datetime, timedelta
from chanakya.src import app

#Api when which a student connecting with Navgurukul
@api.route('/test/validate_enrolment_key')
class EnrollmentKeyValidtion(Resource):
    enrolment_validation_parser = reqparse.RequestParser()
    enrolment_validation_parser.add_argument('enrollment_key', type=str, required=True, help='Not required when regenerating enrollment key for same student')

    @api.doc(parser=enrolment_validation_parser)
    def get(self):
        args = self.enrolment_validation_parser.parse_args()
        enrollment_key = args.get('enrollment_key', None)
        enrollment = EnrolmentKey.query.filter_by(key=enrollment_key).first()

        if not enrollment:
            return {
                "valid": False,
                "reason": "DOES_NOT_EXIST"
            }
        # if enrollment key is expired return Database
        elif enrollment.test_end_time and enrollment.test_end_time < datetime.now():
            return {
                "valid": False,
                "reason": "EXPIRED"
            }
        else:
            # else not expire than start countdown
            start_time = datetime.now()
            enrollment.test_start_time = start_time
            enrollment.test_end_time = start_time + timedelta(seconds=1)
            db.session.add(enrollment)
            db.session.commit()

            return {
                'valid':True,
                'reason': None
            }

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
