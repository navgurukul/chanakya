import os

from .enums import (QuestionDifficulty, QuestionTopic, QuestionType, IncomingCallType, OutgoingSMSType)

class ChanakyaConfig(object):

    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # All the Enums
    QUESTION_DIFFICULTY = QuestionDifficulty
    QUESTION_TOPIC = QuestionTopic
    QUESTION_TYPE = QuestionType
    INCOMING_CALL_TYPE = IncomingCallType
    OUTGOING_SMS_TYPE = OutgoingSMSType

    # Stages
    STAGES = {
        'RQC': 'REQUESTED CALLBACK',
        'EKG': 'ENROLLMENT KEY GENERATED'
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
