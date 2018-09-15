from ..config import ChanakyaConfig

class DevelopmentConfig(ChanakyaConfig):
    DEBUG=True
    SQLALCHEMY_DATABASE_URI = "mysql://root:hellorun123@localhost/chanakya"

    TEST_DURATION = 3460 #in seconds

    # Exotel Related Config
    TEST_ENROLL_MSG = """
    NavGurukul ki scholarship ke liye apply karne ke liye, thank you.
    Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/?key={test_url} kholein aur test ko de.
    Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.
    NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.
    Test ke liye best of luck :) Test ke baad hum aap ko call kar kar, aage ke steps batayenge.
    """
    EXOTEL_AUTH  = {
        'username': 'navgurukul',
        'password': 'd8d7378e5eaa22ebf345a62dd391c479aeedb440'
    }
    EXOTEL_SMS_NUM = "01139595141"

    #S3 Config
    S3_QUESTION_IMAGES_BUCKET = 'chanakya-dev'
    AWS_ACCESS_KEY_ID = 'AKIAJDFDEPKPNADOKHZA'
    AWS_SECRET_ACCESS_KEY = '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'
    AWS_LOCATION = 'http://{}.s3.amazonaws.com/'.format(S3_QUESTION_IMAGES_BUCKET)
    ALLOWED_EXTENSIONS = ['png', 'jpg', 'gif', 'jpeg', 'pdf']
    FILE_CONTENT_TYPES = {
        # these will be used to set the content type of S3 object. It is binary by default.
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'pdf': 'application/pdf',
        'gif': 'image/gif'
    }
