from flask_restplus import Resource, reqparse

from chanakya.src import api

#Api when which a student connecting with Navgurukul
@api.route('/test/validate_enrolment_key')
class EnrollmentKeyValidtion(Resource):
    def get(self):
        return {
        'data': 'Enrollment key Verification'
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
