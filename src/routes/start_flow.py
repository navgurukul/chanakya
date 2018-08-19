from flask_restplus import Resource, reqparse
from chanakya.src import api
from chanakya.src.models import Student
from flask_restful.inputs import boolean


@api.route('/start/send_enrolment_key')
class GenerateEnrollmentKey(Resource):
	enrolment_parser = reqparse.RequestParser()
	enrolment_parser.add_argument('mobile', type=str, required=False, help='Not required when regenerating enrollment key for same student')
	enrolment_parser.add_argument('student_id', type=str, required=False, help='Requires only when regenerate enrollment key manually')
	enrolment_parser.add_argument('from_helpline', type=boolean, required=True, help='Set to true if the call is from helpline')

	@api.doc(parser=enrolment_parser)
	def get(self):
		args =  self.enrolment_parser.parse_args()
		student_id = args.get('student_id',None)
		mobile = args.get('mobile', None)
		from_helpline = args.get('from_helpline')

		#check get the values of mobile or student_id which has been provided
		if not student_id and not mobile:
			return {
				'error':True,
				'message':'Either student_id or mobile is required!'
			}

		# if there exist a mobile number create student
		if mobile:
			message = Student.generate_enrolment_key(mobile, from_helpline)
			return message
		elif student_id:
		# if there exist a student_id check is there any valid enrolmemnt key exist or not
			student = Student.query.filter_by(id=student_id).first()
			if student:
				message = student.send_enrolment_key(from_helpline)
				return message
			else:
				return{
					'error':True,
					'message':"Student doesn't exist for the given student_id"
				}


@api.route('/start/requested_callback')
class RequestCallBack(Resource):
	def post(self):
		return {
			'data':'Navgurukul se call ajayega apko'
		}