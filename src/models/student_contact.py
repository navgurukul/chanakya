import datetime, enum
# from .student import Student
from chanakya.src import db, app, exotel

class StudentContact(db.Model):

    __tablename__ = 'student_contacts'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.String(10))

    main_contact = db.Column(db.Boolean, default=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def send_sms(self, message):
        '''
            for sending the message to number associtated with this instance
            using exotel api

            params:
                message str required

            usage: student_contact.send_sms(message)

        '''
        exotel.sms(app.config.get("EXOTEL_SMS_NUM"), self.contact, message)


class OutgoingCalls(db.Model):

    __tablename__ = 'outgoing_calls'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class IncomingCalls(db.Model):

    __tablename__ = 'incoming_calls'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    call_type = db.Column(db.Enum(app.config['INCOMING_CALL_TYPE']), nullable=False)

<<<<<<< HEAD
=======
    @staticmethod
    def create(student_contact, call_type):
        incoming_call = IncomingCalls(contact=student_contact.id, call_type=app.config['INCOMING_CALL_TYPE'].rqc)
        db.session.add(incoming_call)
        db.session.commit()

>>>>>>> 67b69fd4dad8ab1074580bf2eaafbb0fd5144268
class OutgoingSMS(db.Model):

    __tablename__ = 'outgoing_sms'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    type = db.Column(db.Enum(app.config['OUTGOING_SMS_TYPE']), nullable=False)
    text = db.Column(db.String(300))
