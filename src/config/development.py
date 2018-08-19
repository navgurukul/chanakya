from ..config import ChanakyaConfig

class DevelopmentConfig(ChanakyaConfig):
    DEBUG=True
    SQLALCHEMY_DATABASE_URI = "mysql://root:root@localhost/chanakya"

    TEST_DURATION = 3640 # In seconds
    STAGES = {
    	'EKG': 'ENROLLMENT KEY GENERATE'
    }
