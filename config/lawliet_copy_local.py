import random,string

SQLALCHEMY_DATABASE_URI = 'mysql://ng_lawliet:blackcat13@localhost/chanakya'
SQLALCHEMY_TRACK_MODIFICATIONS = True
TEST_ENROLL_MSG = "Thanks for enrolling for the admission test. Your enrolment number is {enrolment_num}. You can answer the test on http://test.navgurukul.org/?enrollment_key={enrolment_num}"

CRM_AUTH_TOKEN = "dff429d03714ecd774b7706e358e907b"
EXOTEL_AUTH  = {
    'username': 'navgurukul',
    'password': 'd8d7378e5eaa22ebf345a62dd391c479aeedb440'
}
EXOTEL_SMS_NUM = "01139595141"
#SECRET_KEY = "".join([random.choice(string.ascii_uppercase) for x in range(10)])
SECRET_KEY = "abcdef212131"
