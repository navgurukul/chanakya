from flask_restplus import Resource, reqparse
from chanakya.src.models import EnrolmentKey
from chanakya.src import api, db
from chanakya.src import app

#Validation for the enrollmelnt key
@api.route('/test/validate_enrolment_key')
class EnrollmentKeyValidtion(Resource):

    enrolment_validation_parser = reqparse.RequestParser()
    enrolment_validation_parser.add_argument('enrollment_key', type=str, required=True, help='Not required when regenerating enrollment key for same student')

    @api.doc(parser=enrolment_validation_parser)
    def get(self):
        args = self.enrolment_validation_parser.parse_args()
        enrollment_key = args.get('enrollment_key', None)
        enrollment = EnrolmentKey.query.filter_by(key=enrollment_key).first()
       
        #if there is no such enrollment key
        if not enrollment:
            return {
                "valid": False,
                "reason": "DOES_NOT_EXIST"
            }

        # else not expire than start countdown and send it to them
        elif enrollment.is_valid() and not enrollment.in_use():
         
            #adding the start and end time of the test to ensure when to end the test
            enrollment.start_test()
            return {
                'valid':True,
                'reason': None
            }
       
        # checks if the enrollment key is not in use
        elif enrollment.in_use():
            return {
                'valid':True,
                'reason': 'ALREADY_IN_USED'
            }
        
        # enrollment key is expired
        else:
            return {
                "valid": False,
                "reason": "EXPIRED"
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
