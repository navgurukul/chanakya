import random, string

# Database
SQLALCHEMY_DATABASE_URI = 'mysql://root:hello123@35.189.19.99/chanakya'
SQLALCHEMY_TRACK_MODIFICATIONS = True

# Flask level config
SECRET_KEY = "abcdef212131daddaasfaefedawdedsafefhalnhfuy8rgkb"
#SECRET_KEY = "".join([random.choice(string.ascii_uppercase) for x in range(10)])
DEBUG = True
#SERVER_NAME = "join.navgurukul.org"

# Exotel Related Config
TEST_ENROLL_MSG = """
NavGurukul ki scholarship ke liye apply karne ke liye, thank you.

Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/enter-enrolment?enrolment_key={test_url} kholein aur test ko de. Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.

NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.

Test ke liye best of luck :) Test ke baad hum aap ko call kar kar, aage ke steps batayenge.
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
    "Lightbot Activity": {
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
