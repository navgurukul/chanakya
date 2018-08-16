from flask_restplus import Resource, reqparse
from chanakya.src import api
from datetime import datetime
from chanakya.src.models import (
    Student,
    EnrolmentKey,
    IncomingCalls,
    StudentContact
    )
from chanakya.src.config import IncomingCallType
from flask_restful.inputs import boolean
from chanakya.src.helpers import (
    generate_random_string,
    enrollment_generator,
    add_to_db
    )

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
            return{'error':True,'message':'Either student_id or mobile is required!'}
        elif not mobile and from_helpline:
            return{'error':True,'message':'Need mobile number if the call is from helpline'}
        elif not student_id and not from_helpline:
            return{'error':True,'message': 'Need the student id to Generate Enrollment Key'}

        # if the call is from the helpline number for creating a new key
        if mobile and from_helpline:
            # Creating new student when a call is from helpline for key generation
            student = Student(stage='Enrollment Key Generated')
            add_to_db(student)

            # number from which the user called on helpline
            student_contact = StudentContact(contact=mobile, main_contact=False, student_id = student.id)
            add_to_db(student_contact)

            # creating a record for the incoming call type
            incoming_call = IncomingCalls(call_type=IncomingCallType.ekg, contact=student_contact.id)
            add_to_db(incoming_call)

            #generating enrollment key
            enrollment_key = enrollment_generator()
            enrollment = EnrolmentKey(key=enrollment_key, student_id = student.id)
            add_to_db(enrollment)

            #TODO send the sms to the user
            return {
                'sent':True,
                'generated':True
            }

        # if the call is not from the helping than check if the key is valid or not if it
        # is not valid than generate a new key and send it to the on the phone_number.
        elif student_id and not from_helpline:
            enrollment_key = EnrolmentKey.query.filter_by(student_id = student_id).order_by(EnrolmentKey.created_at).first()

            #check if the student enrollment key is valid or not else create a new one
            if not enrollment_key.test_start_time:
                #resend enrollment Key

                # TODO send the sms to the user with the key
                return {
                    'sent': True,
                    'generated':False
                }

            elif enrollment_key.test_end_time < datetime.now:
                #create a new enrollment key
                enrollment_key = enrollment_generator()
                student = Student.query.filter_by(id = student_id).first()
                if student:
                    enrollment = EnrolmentKey(key=enrollment_key, student_id = student.id)
                    add_to_db(enrollment)
                    # TODO  send the sms to user with the key

                    return {
                        'sent':True,
                        'generated':True
                    }

        return {
            'sent':False,
            'generated':False
        }


@api.route('/start/requested_callback')
class RequestCallBack(Resource):
    def post(self):
        return {
            'data':'Navgurukul se call ajayega apko'
        }
