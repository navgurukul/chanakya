from flask_restplus import Resource, reqparse, fields, Namespace

from chanakya.src import app, db
from chanakya.src.models import Student, IncomingCalls, StudentContact, StudentStageTransition
from chanakya.src.google_sheet_sync.sync_database import SyncDatabase


api = Namespace('start_flow', description='Handle student when they join the Platform.')
@api.route('/send_enrolment_key')
class GenerateEnrollmentKey(Resource):

	post_payload_model = api.model('POST_send_enrolment_key', {
		'mobile': fields.String(required=False),
		'student_id': fields.Integer(required=False),
		'from_helpline': fields.Boolean(required=True)
	})

	post_response = api.model('POST_send_enrolment_key_response', {
		'error': fields.Boolean(default=False),
		'generated':fields.Boolean(default=False),
		'sent':fields.Boolean(default=False),
		'enrollment_key':fields.String,
		'message':fields.String
	})

	@api.expect(post_payload_model)
	def post(self):

		args = api.payload

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
		# If mobile is provided in payload, means a new student needs to be created
		elif mobile:
			message = Student.generate_enrolment_key(mobile, from_helpline)
			return message


@api.route('/requested_callback')
class RequestCallBack(Resource):

	post_payload_model = api.model('POST_requested_callback', {
		'mobile': fields.String(required=True)
	})

	@api.expect(post_payload_model)
	def post(self):

		args = api.payload

		mobile = args.get('mobile')

		# Find the most recently created student with the given mobile
		# For a student whose record exists, only a new incoming call will be recorded
		called_number = StudentContact.query.filter_by(contact=mobile).order_by(StudentContact.created_at.desc()).first()

		# If the student with the given mobile doesn't exist then create a new student
		# This student will have the RQC stage
		if not called_number:
			student, called_number = Student.create(stage = 'RQC', mobile = mobile)
		else:
			student = called_number.student
			StudentStageTransition.record_stage_change('RQC',student)

		# Record the incoming call in the DB
		IncomingCalls.create(called_number, call_type=app.config['INCOMING_CALL_TYPE'].rqc)

		return {
			'success': True
		}

@api.route('/sync_google_sheet')
class Sync(Resource):
	def put(self):
		sync_datadase = SyncDatabase()
		return {
			'success':True
		}
