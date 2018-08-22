from ..config import ChanakyaConfig

class DevelopmentConfig(ChanakyaConfig):
    DEBUG=True
    SQLALCHEMY_DATABASE_URI = "mysql://root:root@localhost/chanakya"

    TEST_DURATION = 3460 #in seconds

    STAGES = {
        'RQC': 'REQUESTED CALLBACK',
        'EKG': 'ENROLLMENT KEY GENERATED'
    }
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
