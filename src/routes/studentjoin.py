from flask_restplus import Resource
from flask_restplus import reqparse
from chanakya.src import api


@api.route('/generate-enrollment-key')
class GenerateEnrollmentKey(Resource):
    # args_parser = reqparse.RequestParser()
    # args_parser.add_argument('PhoneNumber', type=int, help='Number to which the sms will be sent')
    # args_parser.add_argument('record_id')
    def post(self):
        return {'data': 'here is some *more* data'}

@api.route('/requested-callback')
class RequestCallBack(Resource):
    def post(self):
        return {
        'data':'Navgurukul se call ajayega apko'
        }
