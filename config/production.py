# Database
SQLALCHEMY_DATABASE_URI = 'mysql://root:hello123!@35.189.19.99/chanakya'
SQLALCHEMY_TRACK_MODIFICATIONS = True

# Flask level config
SECRET_KEY = "abcdef212131"
DEBUG = True

# Exotel Related Config
TEST_ENROLL_MSG = """
Thanks for enrolling for the admission test.\
Your enrolment number is {enrolment_num}. You can answer the test on http://test.navgurukul.org/?enrollment_key={enrolment_num}"
"""
EXOTEL_AUTH  = {
    'username': 'navgurukul',
    'password': 'd8d7378e5eaa22ebf345a62dd391c479aeedb440'
}
EXOTEL_SMS_NUM = "01139595141"

# Zoho CRM Related Config
CRM_AUTH_TOKEN = "dff429d03714ecd774b7706e358e907b"
POTENTIAL_STUDENT_STAGE_NOTIFS = {
    "Interested & Called": None,
    "Entrance Test": None,
    "Test Scheduled": {
        "sms": "Some SMS text",
        "exotel_obd_id": None,
        "referral_email_template": "Here is a template"
    },
    "Privilege Check": None,
    "Personal Interview": None,
    "Parent Conversation": None,
    "Confirmed Joining": None,
    "Probation Period": None,
    "NG Fellow": None,
    "Failed Probation": None,
    "Graduated": None,
    "Became Disinterested": None,
    "Entrance Test Failed": None,
    "Lightbot Activity Failed": None,
    "Privilege Check Failed": None,
    "Personal Interview Failed": None,
    "Parent Conversation Failed": None,
    "Probation Failed": None,
    "Left before Completion": None,
    "Kicked Out": None
}