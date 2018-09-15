import datetime, enum
# from .student import Student
from chanakya.src import db, app, exotel
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

    @staticmethod
    def create(contact,student_id,main_contact = False):
        '''
            function is used for creating a new student_contact record for the student_id

            params:
             contact : str ,required ,length=10
             student_id: int, required
             main_contact: bool, default=False

        '''
        student_contact = StudentContact(contact=contact, student_id=student_id, main_contact=main_contact)
        db.session.add(student_contact)
        db.session.commit()

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

    @staticmethod
    def create(student_contact, call_type):
        incoming_call = IncomingCalls(contact=student_contact.id, call_type=app.config['INCOMING_CALL_TYPE'].rqc)
        db.session.add(incoming_call)
        db.session.commit()

class OutgoingSMS(db.Model):

    __tablename__ = 'outgoing_sms'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    type = db.Column(db.Enum(app.config['OUTGOING_SMS_TYPE']), nullable=False)
    text = db.Column(db.String(300))
