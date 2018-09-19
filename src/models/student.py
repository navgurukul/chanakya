import datetime, enum
from chanakya.src import db, app
from .student_contact import (StudentContact, IncomingCalls)

from .test import EnrolmentKey

class Student(db.Model):

    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # personal details fields
    stage = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(200))
    gender = db.Column(db.Enum(app.config['GENDER']))
    dob = db.Column(db.Date)

    #extra detail fields
    caste = db.Column(db.Enum(app.config['CASTE']))
    religion = db.Column(db.Enum(app.config['RELIGION']))
    monthly_family_income = db.Column(db.Integer)
    total_family_member = db.Column(db.Integer)
    family_member_income_detail = db.Column(db.Text)

    @staticmethod
    def create(stage, **kwargs):
        """
        This function create the student object with list of contact or single contact or the
        main_contact where we have to call them
        it requires **kwargs

        Params:
            mobile : str  (the number from which the person called on the helpline)
            contact_list: list of str (list of all the number of the student)
            main_contact : str (the number to which we can connect with the student)

        USAGE: Student.create(stage, **kwargs)

        Returns: student object and also the student_contact object if the called was not the helpline

        """
        mobile=kwargs.get('mobile', None)
        contacts_list=kwargs.get('contacts_list', None)
        main_contact=kwargs.get('main_contact', None)

        student = Student(stage=app.config['STAGES'][stage])

        db.session.add(student)
        db.session.commit()


        # adding the number to which we can connect to the student
        if main_contact:
            student_contact = StudentContact(contact=mobile, main_contact=True, student_id=student.id)
            db.session.add(student_contact)
            db.session.commit()

        # adding the list of the contact
        if contacts_list:
            for contact in main_contacts:
                contact = StudentContact(contact=mobile, student_id=student.id)
                db.session.add(contact)
                db.session.commit()
        # if the call is from helpline create a record in student contact
        if mobile:
            call_from_number = StudentContact(contact=mobile, student_id=student.id)
            db.session.add(call_from_number)
            db.session.commit()

            # return the student object and number called at helpline
            return student, call_from_number

        # if there was no called on helpline just send the student object
        return student


    @staticmethod
    def offline_student_record(stage, student_data, main_contact, mobile, set):
        """
            function helps to add student data who have given the test offline.
            it creates a student instance and then update it's data with contact infomation
            and create a enrollment key for the student.

            params:
                stage: 'PRIVILEGE AND VERIFICATION CALL',
                student_data : {
                    contains the data which need to be added to the Student table
                    'name':'Amar Kumar Sinha',
                    'dob': datetime(1997, 9, 18)
                    'gender': 'MALE',
                    'religion': 'Hindu'
                }

                main_contact : The number on which we can contact the student
                mobile : An another number which is present as Potential Name
                set_id : An set_id of question set which was generated for the partner can be saved to enrollment to get the question easily.
        """

        student , call_from = Student.create(stage, main_contact=main_contact, mobile=mobile)

        student.update_data(student_data)
        student_id = student.id

        enrollment = EnrolmentKey.generate_key(student_id)
        enrollment.question_set_id = set.id

        enrollment.start_test()
        enrollment.end_test()

        return student, enrollment


    @staticmethod
    def generate_enrolment_key(mobile, from_helpline):
        """
            This function helps to create a a record of a new student in
            the database were the from_helpine varibale helps to track was
            the call from helpline or was manually created and send the enrollment
            key to the mobile number

            Note: if the key was generated from_helpline record also record the incoming calls.

            USAGE :
                Student.generate_enrolment_key(mobile, from_helpline)

            Params:
                `mobile` : String required
                `from_helpline` : Boolean required

        """

        # create a new student record in the platform with this mobile number
        student, call_from_number = Student.create(stage='EKG', mobile=mobile)
         # recording the api call if it was from the helpine
        if from_helpline:
            IncomingCalls.create(student_contact=call_from_number,call_type=app.config['INCOMING_CALL_TYPE'].ekg)
        # sending sms to each and everynumber of the student
        message = student.send_enrolment_key(from_helpline)

        return message

    def update_data(self, student_data, mobiles=[]):
        """
        Update the student's data.

        params:
        `student_data`: Should contain the fields of student instance which needs to be updated
                        in dictionary format.
                        for example: {'name': 'Amar Kumar Sinha', 'gender': gender.male #enum}
        `mobiles`: List of strings with student mobile numbers to be updated. Example:
                    ['8130378953', '8130378965']. If they exist as contacts associated with the
                    given student no new contacts will be created, otherwise new ones will be
                    created.
        """

        # update the attributes given by the `student_data` dict
        for key, value in student_data.items():
            if key in self.__dict__.keys():
                setattr(self, key, value)
        db.session.add(self)
        db.session.commit()

        # get all the associated student contacts
        contacts = StudentContact.query.filter_by(student_id=self.id).all()
        contacts = [contact.contact for contact in contacts]
        for mobile in mobiles:
            # if the given mobile doesn't exist as one of the student contacts
            if not mobile in contacts:
                contact = StudentContact(contact=mobile, student_id=self.id)
                db.session.add(contact)
            else:
                print("Nahi hua create.")
        db.session.commit()



    def send_enrolment_key(self, from_helpline):
        """
            Method is used to send valid enrollment key to the student if exist
            else it will generate a new enrollment key and send it to the user

            USAGE:
                instance.send_enrollment_key(from_helpline)

            params:
                from_helpline : Boolean required

        """

        student_id = self.id

        # getting the latest enrollment key from the database
        enrollment = EnrolmentKey.query.filter_by(student_id=student_id).order_by(EnrolmentKey.created_at.desc()).first()

        #no enrollment key exist then create a new key and send it in the case of rqc and intrested
        if not enrollment:
            enrollment = EnrolmentKey.generate_key(student_id)
            #send the enrollment key message to the student contact
            message = {
                'generate':True,
                'sent':True,
                'enrollment_key':enrollment.key
            }
        #check if the enrollment key is valid or not
        elif enrollment.is_valid():
            message = {
                'generate': False,
                'sent': True,
                'enrollment_key':enrollment.key
            }
        # if the key is not valid then generating a new valid key for the student
        else:
            enrollment = EnrolmentKey.generate_key(student_id)
            message = {
                'generate': True,
                'sent': True,
                'enrollment_key':enrollment.key
            }

        print(enrollment.key)
        # getting the test that we have to send the student
        enrollment_message = app.config.get("TEST_ENROLL_MSG").format(test_url=enrollment.key)

        # getting all the contact of the student
        student_contacts = StudentContact.query.filter_by(student_id=student_id).all()
        #send enrollment message to all the contact linked to the student
        for contact in student_contacts:
            contact.send_sms(enrollment_message)

        return message


class StudentStageTransition(db.Model):

    __tablename__ = 'stage_transitions'

    id = db.Column(db.Integer, primary_key=True)
    from_stage = db.Column(db.String(100), nullable=False)
    to_stage = db.Column(db.String(100), nullable=False)
    notes = db.Column(db.String(1000))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
