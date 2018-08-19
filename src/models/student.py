import datetime, enum
from chanakya.src import db, app
from .student_contact import (StudentContact, IncomingCalls)

from .test import EnrolmentKey
class Student(db.Model):

    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    stage = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    @staticmethod
    def generate_enrolment_key(mobile, from_helpline):
        '''
            this function helps to create a a record of a new student in the database were the from_helpine varibale helps to track was the call from helpline or was manually created and send the enrollment key to the mobile number

            if was from_helpline record the incoming calls also
            
            USAGE :
                Student.generate_enrolment_key(mobile, from_helpline)

            params: 
                mobile : String required
                from_helpline : Boolean required

        '''
        student = Student(stage=app.config['STAGES']['EKG'])
        db.session.add(student)
        db.session.commit()
        student_contact = StudentContact(contact=mobile, main_contact=False, student_id=student.id)
        db.session.add(student_contact)
        db.session.commit()

        #Send sms when the call is from helpine else don't send the sms
        message = student.send_enrolment_key(from_helpline)

        return message

    def send_enrolment_key(self, from_helpline):
        '''
            Method is used to send valid enrollment key to the student if exist
            else it will generate a new enrollment key and send it to the user

            USAGE: 
                instance.send_enrollment_key(from_helpline)

            params:
                from_helpline : Boolean required

        '''
        student_id = self.id
        
        enrollment = EnrolmentKey.query.filter_by(student_id=student_id).order_by(EnrolmentKey.created_at.desc()).first()

        student_contact = StudentContact.query.filter_by(student_id=student_id,main_contact=False).order_by(StudentContact.created_at.desc()).first()

        #no enrollment key exist create a new key and send it
        if not enrollment:
            enrollment_key = EnrolmentKey.generate_key(student_id)
            
            #send the enrollment key message to the student contact
            message = {
                'generate':True,
                'sent':True
            }
        #if a key exist and is not expired just send it to him 
        elif not enrollment.test_start_time:

            #send the enrollment key message to the student contact
            message = {
                'generate':False,
                'sent':True
            }
        # check if the enrollment key is expired then send a new key
        elif enrollment.test_end_time < datetime.datetime.now():
            enrollment_key = EnrolmentKey.generate_key(student_id)

            #send the enrollment key message to the student contact
            message = {
                'generate':True,
                'sent':True
            }       

        # To record if there is a incoming call on helpline
        if from_helpline:
            incoming_calls = IncomingCalls(contact=student_contact.id,call_type=app.config['INCOMING_CALL_TYPE'].ekg)
            db.session.add(incoming_calls)
            db.session.commit()

        return message


class StudentStageTransition(db.Model):

    __tablename__ = 'stage_transitions'

    id = db.Column(db.Integer, primary_key=True)
    from_stage = db.Column(db.String(100), nullable=False)
    to_stage = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.String(1000))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
