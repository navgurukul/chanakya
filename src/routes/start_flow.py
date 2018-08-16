from flask_restplus import Resource, reqparse
from chanakya.src import api


@api.route('/start/send_enrolment_key')
class GenerateEnrollmentKey(Resource):
    # args_parser = reqparse.RequestParser()
    # args_parser.add_argument('PhoneNumber', type=int, help='Number to which the sms will be sent')
    # args_parser.add_argument('record_id')
    def get(self):
        return {'data': 'here is some *more* data'}

@api.route('/start/requested_callback')
class RequestCallBack(Resource):
    def get(self):
        return {
            'data':'Navgurukul se call ajayega apko'
        }
