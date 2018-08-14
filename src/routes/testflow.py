from flask_restplus import Resource
from flask_restplus import reqparse
from chanakya.src import api

#Api when which a student connecting with Navgurukul
@api.route('/validate-enrollment-key')
class EnrollmentKeyValidtion(Resource):
    def get(self):
        return {
        'data': 'Enrollment key Verification'
        }

@api.route('/personal-detail-submitted')
class PersonalDetailSubmit(Resource):
    def post(self):
        return {
        'data':'Detail Submitted'
        }
@api.route('/start-test'):
class TestStart(Resource):
    def get(self):
        return {
        'data':'Test Question Sent'
        }

@api.route('/end-test'):
class TestEnd(Resource):
    def post(self):
        return {
        'data': 'Test end and question submitted'
        }

@api.route('/more-details'):
class MoreDetail(Resource):
    def post(self):
        return {
        'data':'All Detail Submitted'
        }
