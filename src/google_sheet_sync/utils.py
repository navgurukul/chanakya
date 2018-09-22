import pygsheets
from chanakya.src import app
from .config import SERVICE_FILE, SHEET_NAME, DATE_TIME_FORMAT

def get_worksheet():
    """
        Helps to get the google work sheet instance and connect using the service_file in config which
        path to service_file to use Google Drive API and the sheet_name on which the whole data should be sync.

        Return:
            worksheet instance made by pygsheets.
    """

    google_drive = pygsheets.authorize(service_file=SERVICE_FILE)
    sheet = google_drive.open(SHEET_NAME)
    worksheet = sheet.sheet1
    return worksheet

def get_test_duration(enrollment):
    """
        Helps to calculate the Test Duration of the student to find how quickly have he given a test or haven't he cheated in it.
        Params:
            `enrollment` : EnrolmentKey instance.
        Return:
            `time_taken`: If student has gave the test it return the duration as format (1h :2m :23s)
                          else it return None
    """

    if enrollment.is_test_ended():
        seconds = (enrollment.test_end_time - enrollment.test_start_time).seconds
        hours  = seconds//(60*60)
        seconds = seconds%(60*60)

        minutes = seconds//60
        seconds = seconds%60
        time_taken = '{0}h :{1}m :{2}s '.format(hours, minutes, seconds)
        return time_taken
    return None


def get_student_record_as_dict(student):
    """
        The function helps to create a dictionary of student data which look like below.
        {
            'Name':'Amar Kumar Sinha',
            'Student Id': 1,
            'Gender': 'MALE',
            'Caste':'OBC',
            'Stage':'PERSONAL DETAIL SUBMITTED',
            'Date of Birth':18-09-1997,
            'Religion':None,
            'Monthly Family Income':None,
            'Total Family Member':None,
            'Family Member Income Detail':None
            ...
            ...
            ...
        }

        Params:
            `student` Student class instance through which we can extract all the link data.

        Return:
            The dictionary created below.
            {
                'Name':'Amar Kumar Sinha',
                'Student Id': 1,
                'Gender': 'MALE',
                'Date of Birth':18-09-1997,
                'Religion':None,
                'Total Family Member':None,
                'Family Member Income Detail':None
                ...
                ...
                ...
            }
    """

    enrollment = student.enrollment_keys.first()

    main_contact = student.contacts.filter_by(main_contact=True).first()
    contact = student.contacts.filter_by(main_contact=False).first()

    number_of_rqc = 0
    student_row = {}

    student_row['Name'] = student.name
    student_row['Gender'] = student.gender.value
    student_row['Student Id'] = student.id
    student_row['Date of Birth'] = student.dob.strftime(DATE_TIME_FORMAT)
    student_row['Caste'] = student.caste.value
    student_row['Stage'] = student.stage
    student_row['Religion'] = student.religion.value
    student_row['Monthly Family Income'] = student.monthly_family_income
    student_row['Total Family Member'] = student.total_family_member
    student_row['Family Member Income Detail'] = student.family_member_income_detail

    if main_contact:
        number_of_rqc += main_contact.incoming_calls.filter_by(call_type = app.config['INCOMING_CALL_TYPE'].rqc).count()
        student_row['Main Contact'] =  main_contact.contact

    if contact:
        number_of_rqc += contact.incoming_calls.filter_by(call_type = app.config['INCOMING_CALL_TYPE'].rqc).count()
        student_row['Alternative Contact'] = contact.contact

    student_row['Number Incoming RQC'] = number_of_rqc

    if enrollment:
        student_row['Enrollment Key'] = enrollment.key
        student_row['Test Score'] = enrollment.score
        student_row['Test Duration'] = get_test_duration(enrollment)
    else:
        student_row['Enrollment Key'] = None
        student_row['Test Score'] = None
        student_row['Test Duration'] = None

    return student_row

def get_all_details_updated_in_df(data_frame, student):
    """
        The function helps to update the data_frame which contains the headers as the key
        and the data_frame contains the data of the student present in the Google Sheets currently.


        Params:
            `student`: Student class instance through which we can extract all the link data.
            `data_frame`: Contains the student data present on Google Sheets as a DataFrame object.

        Return:
            The updated DataFrame object.
            {
                'Name':'Amar Kumar Sinha',
                'Student Id': 1,
                'Gender': 'MALE',
                'Date of Birth':18-09-1997,
                'Religion':None,
                'Total Family Member':None,
                'Family Member Income Detail':None
                ...
                ...
                ...
            }
    """
    enrollment = student.enrollment_keys.all().first()

    main_contact = student.contacts.filter_by(main_contact=True).first()
    contact = student.contacts.filter_by(main_contact=False).first()


    data_frame['Name'] = student.name
    data_frame['Gender'] = student.gender.value
    data_frame['Date of Birth'] = student.dob.strftime(DATE_TIME_FORMAT)
    data_frame['Caste'] = student.caste.value
    data_frame['Stage'] = student.stage
    data_frame['Religion'] = student.religion.value
    data_frame['Monthly Family Income'] = student.monthly_family_income
    data_frame['Total Family Member'] = student.total_family_member
    data_frame['Family Member Income Detail'] = student.family_member_income_detail
    number_of_rqc = 0

    if main_contact:
        number_of_rqc += main_contact.incoming_calls.filter_by(call_type = app.config['INCOMING_CALL_TYPE'].rqc).count()
        data_frame['Main Contact'] =  main_contact.contact

    if contact:
        number_of_rqc += contact.incoming_calls.filter_by(call_type = app.config['INCOMING_CALL_TYPE'].rqc).count()
        data_frame['Alternative Contact'] = contact.contact

    data_frame['Number Incoming RQC'] = number_of_rqc

    if enrollment:
        data_frame['Enrollment Key'] = enrollment.key
        data_frame['Test Score'] = enrollment.score
        data_frame['Test Duration'] = get_test_duration(enrollment)
    else:
        data_frame['Enrollment Key'] = None
        data_frame['Test Score'] = None
        data_frame['Test Duration'] = None

    return data_frame
