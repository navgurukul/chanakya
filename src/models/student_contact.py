import datetime, enum

from chanakya.src import db, app

class StudentContact(db.Model):

    __tablename__ = 'student_contacts'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.String(10))
    main_contact = db.Column(db.Boolean)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

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

class OutgoingSMS(db.Model):

    __tablename__ = 'outgoing_sms'

    id = db.Column(db.Integer, primary_key=True)
    contact = db.Column(db.Integer, db.ForeignKey('student_contacts.id'))
    type = db.Column(db.Enum(app.config['OUTGOING_SMS_TYPE']), nullable=False)
    text = db.Column(db.String(300))
