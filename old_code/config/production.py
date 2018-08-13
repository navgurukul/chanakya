import random, string
import os

STUDENT_DIRECTORY = os.path.expanduser('/home/ubuntu/student_files')
TEST_VERSION = "New Assessment (v0.1)"
SYSTEM_ENVIRONMENT="Production"

# Database
#SQLALCHEMY_DATABASE_URI = 'mysql://root:hello123@35.189.19.99/chanakya'
SQLALCHEMY_DATABASE_URI = os.environ['SQLALCHEMY_DATABASE_URI']
SQLALCHEMY_TRACK_MODIFICATIONS = True

# Flask level config
SECRET_KEY = "abcdef212131daddaasfaefedawdedsafefhalnhfuy8rgkbdasfasfafewqrffd"
#SECRET_KEY = "".join([random.choice(string.ascii_uppercase) for x in range(10)])
DEBUG = True
#SERVER_NAME = "join.navgurukul.org"

# Exotel Related Config
TEST_ENROLL_MSG = """
NavGurukul ki scholarship ke liye apply karne ke liye, thank you.

Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/?key={test_url} kholein aur test ko de. Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.

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
        "sms": "Congrats! Aapne NavGurukul ki Scholarship paane ka first step clear kar liya hai. Hum aap ko kuch hi samay mei call karke agle steps ki jaan kaari denge. Kaafi kam log iss tarah se test mei itna accha perform kar paate hai. Aap helpline number ( 011-3959-5141) par bhi call kar sakte hai, adheek jaankaari ke liye.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is a template"
    },
    "Privilege Check": {
        "sms": "Congrats! Aapne NavGurukul ki scholarship ke test ka dusra test bhi clear kar liya hai. Yeh test bahot kam log hi clear kar pate hain. Hum aap ko call kar kar aage ke steps jaldi hi batayenge. Aap helpline number ( 011-3959-5141) par bhi call kar sakte hai, adheek jaankaari ke liye.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is a template."
    },
    "Personal Details Submitted":None,
    "All Details Submitted":None,
    "Personal Interview": None,
    "Parent Conversation": None,
    "Confirmed Joining": None,
    "Probation Period": None,
    "NG Fellow": None,
    "Failed Probation": None,
    "Graduated": None,
    "Became Disinterested": None,
    "Entrance Test Failed": {
        "sms": "NavGurukul ki scholarship ka test kaafi mushkil hai aur kaafi kam log isse clear kar paate hai. Hume yeh batate hue kaafi dukh ho raha hai, ki aapka test clear nahi hua hai. Par humein poora bharosa hai ki aap ke paas aisi aur kaafi opportuntiies aayengi, jinke saath aap apne sapnei poore kar paaoge. Good luck.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is a template."
    },
    "Lightbot Activity Failed": {
        "sms": "NavGurukul ki scholarship ka dusra test kaafi mushkil hota hai aur isse kaafi kam log hi clear kar pate hain. Humein yeh batae hue kaafi dukh hai, ki aapke test ka dusra round clear nahi hua hai. Par humein poora bharosa hai ki aap ke paas aisi aur kaafi opportuntiies aayengi, jinke saath aap apne sapnei poore kar paaoge. Good luck.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is the a tempalate."
    },
    "Privilege Check Failed": None,
    "Personal Interview Failed": None,
    "Parent Conversation Failed": None,
    "Probation Failed": None,
    "Left before Completion": None,
    "Kicked Out": None
}
CRM_NEW_STUDENT_TASKS = {
    "Requested Callback": {
        "task_message": "[Requested Callback] Call back and take next steps",        
        "Call Flow State": "_RQC_ Calling",
    },

    "All Details Submitted": {
        "task_message": "[All Details Submitted] Evaluate the answers and decide next steps.",
        "Call Flow State": "_ET_ Check Marks",

    }
}

REQUESTED_CALLBACK_POTENTIAL_OWNERS = [
    "2821772000001108001", #shivnath
]

TEST_RELATED_POTENTIAL_OWNERS= [
    "2821772000001145029", #ranjan
    "2821772000001918016", #bobby
]

MINIMUM_PASSING_SCORE=18
#"2821772000000131011", #Rishabh Verma
#"2821772000000503001", #Shanu
