import os

from .enums import (
        QuestionDifficulty,
        QuestionTopic,
        QuestionType,
        IncomingCallType,
        OutgoingSMSType,
        Gender,
        Caste,
        Religion
    )

class ChanakyaConfig(object):

    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Restplus
    RESTPLUS_VALIDATE = True

    # All the Enums
    QUESTION_DIFFICULTY = QuestionDifficulty
    QUESTION_TOPIC = QuestionTopic
    QUESTION_TYPE = QuestionType
    INCOMING_CALL_TYPE = IncomingCallType
    OUTGOING_SMS_TYPE = OutgoingSMSType
    GENDER = Gender
    CASTE = Caste
    RELIGION = Religion

    #exam_config to generate question
    QUESTION_CONFIG  = {

        # how many question should be generated according to the category of question
        # and the difficulty level each question has
        "topic":{
            "BASIC_MATH":{
                "Easy":3, # number of question that should be generated
                "Medium":3,
                "Hard":3
            },
            "ABSTRACT_REASONING":{
                "Easy":2,
                "Medium":2,
                "Hard":2
            },
            "NON_VERBAL_LOGICAL_REASONING":{
                "Easy":1,
                "Medium":1,
                "Hard":1
            },
        },

        # marks of the question according to difficulty
        "marks_config" :{
            "Easy":1,
            "Medium":2,
            "Hard":3
        }

    }

    TEST_DURATION = 3670 + (20*60)#in seconds

    # Exotel Related Config
    TEST_ENROLL_MSG = """
    NavGurukul ki scholarship ke liye apply karne ke liye, thank you.
    Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/?key={test_url} kholein aur test ko de.
    Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.
    NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.
    Test ke liye best of luck :) Test ke baad hum aap ko call kar kar, aage ke steps batayenge.
    """
    # Stages
    STAGES = {
        'RQC': 'REQUESTED CALLBACK',
        'EKG': 'ENROLLMENT KEY GENERATED',
        'PDS': 'PERSONAL DETAIL SUBMITTED',
        'ADS': 'ALL DETAIL SUBMITTED',
        'PVC': 'PRIVILEGE & VERIFICATION CALL'
    }
    OUTGOING_SMS = {
        'PVC': 'Kuch message Privilege and verification call ke liye',
        'ADS': 'Kuch message All details Sumitted ke liye'
    }


    @staticmethod
    def get_config():
        """Gets the config on basis of the `CHANAKYA_ENVIRONMENT` environment variable.
        Possible values of the env variable are:
        1. `PRODUCTION`
        2. 'STAGING'
        3. `DEVELOPMENT`

        This method will also try to import ProductionConfig (from config.production),
        StagingConfig (from config.staging) & DevelopmentConfig (from config.development)
        and throw an exception in case it is not able to import any one of them. This is
        important as all of these files (`config/staging.py`, `config/development.py`,
        `config/production.py`) will be in .gitignore to ensure security.


        *Note:* This also checks that value of CHANAKYA_ENVIRONMENT and FLASK_ENV should be the same.

        Return:
        A config class object which will be an instance of ChanakyaConfig.
        """

        # get the CHANAKYA_ENVIRONMENT environment variable
        mode = os.environ.get('CHANAKYA_ENVIRONMENT')
        if mode not in ['production', 'development', 'staging']:
            raise Exception('`CHANAKYA_ENVIRONMENT` environment variable is either set incorrectly or not set.')

        # get the FLASK_ENV environment variable
        flask_env = os.environ.get('FLASK_ENV')
        if flask_env != mode:
            raise Exception('The values of `FLASK_ENV` and `CHANAKYA_ENVIRONMENT` need to be the same.')

        # get the required config as per environment variable
        if mode == "PRODUCTION":
            from chanakya.src.config.production import ProductionConfig
            Config = ProductionConfig
        elif mode == "STAGING":
            from chanakya.src.config.staging import StagingConfig
            Config = StagingConfig
        else:
            from chanakya.src.config.development import DevelopmentConfig
            Config = DevelopmentConfig

        # check if the imported class is an instance of ChanakyaConfig
        if issubclass(Config, ChanakyaConfig):
            return Config()
        else:
            raise Exception("The imported config is not a subclass of `ChanakyaConfig`")
