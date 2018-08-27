from flask_restplus import Resource, reqparse
from chanakya.src import api, app, db
from chanakya.src.models import Student, IncomingCalls, StudentContact
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

		# check if either student_id or mobile is provided
		if not student_id and not mobile:
			return {
				'error':True,
				'message':'Either student_id or mobile is required!'
			}

		# if the student exist in the database then just send him a valid enrollment key to his number
		if student_id:
			student = Student.query.filter_by(id=student_id).first()

			if student:
				message = student.send_enrolment_key(from_helpline)
				return message

			# handle error if the student doesn't exist
			else:
				return {
					'error':True,
					'message':"Student doesn't exist for the given student_id"
				}
		# if mobile exists, it means that a new student needs to be created as we don't have access to the student record.
		elif mobile:
			message = Student.generate_enrolment_key(mobile, from_helpline)
			return message


@api.route('/start/requested_callback')
class RequestCallBack(Resource):
	requested_callback_parser = reqparse.RequestParser()
	requested_callback_parser.add_argument('mobile', type=str, required=True, help='Not required when regenerating enrollment key for same student')

	@api.doc(parser=requested_callback_parser)
	def get(self):

		args = self.requested_callback_parser.parse_args()
		mobile = args.get('mobile', None)

		# finding the contact of the student of have join the platform most recently
		called_number = StudentContact.query.filter_by(contact=mobile).order_by(StudentContact.created_at.desc()).first()

		# if the caller number doesn't exist in the platform then create a new student
		if not called_number:
			student, called_number = Student.create(stage = 'RQC', mobile = mobile)

		# record the incoming call of that number
		IncomingCalls.create(called_number, call_type=app.config['INCOMING_CALL_TYPE'].rqc)

		return{
			'success': True
		}
