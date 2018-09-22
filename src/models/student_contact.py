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
    incoming_calls = db.relationship('IncomingCalls', backref='contact', cascade='all, delete-orphan', lazy='dynamic')
    outgoing_calls = db.relationship('OutgoingCalls', backref='contact', cascade='all, delete-orphan', lazy='dynamic')
    outgoing_messages = db.relationship('OutgoingSMS', backref='contact', cascade='all, delete-orphan', lazy='dynamic')


    def send_sms(self, message):
        """
            For sending the message to number associtated with this instance using exotel api.

            Params:
                `message` - Contains the message that need to be sent str required

            Usage: student_contact.send_sms(message)

        """
        exotel.sms(app.config.get("EXOTEL_SMS_NUM"), self.contact, message)

    @staticmethod
    def create(contact,student_id,main_contact = False):
        """
            Function is used for creating a new student_contact record for the student_id.

            Params:
                `contact` : '7896121314' Student mobile number
                `student_id`: '21' Student id
                `main_contact`: True(default is False) True if we can call on this number to connect with the student else False.
        """

        student_contact = StudentContact(contact=contact, student_id=student_id, main_contact=main_contact)
        db.session.add(student_contact)
        db.session.commit()

class OutgoingCalls(db.Model):

    __tablename__ = 'outgoing_calls'

    id = db.Column(db.Integer, primary_key=True)
    contact_id = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class IncomingCalls(db.Model):

    __tablename__ = 'incoming_calls'

    id = db.Column(db.Integer, primary_key=True)
    contact_id = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    call_type = db.Column(db.Enum(app.config['INCOMING_CALL_TYPE']), nullable=False)

    @staticmethod
    def create(student_contact, call_type):
        """
            Helps to record all the incoming call made by a students phone number.
            Params:
                `student_contact` : StudentContact instance,
                `call_type`: 'RQC' ['EKG', 'RQC', 'INTERESTED']
        """

        incoming_call = IncomingCalls(contact_id=student_contact.id, call_type=call_type)
        db.session.add(incoming_call)
        db.session.commit()

class OutgoingSMS(db.Model):

    __tablename__ = 'outgoing_sms'

    id = db.Column(db.Integer, primary_key=True)
    contact_id = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    type = db.Column(db.Enum(app.config['OUTGOING_SMS_TYPE']), nullable=False)
    text = db.Column(db.String(300))
