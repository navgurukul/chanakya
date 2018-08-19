from ..config import ChanakyaConfig

class DevelopmentConfig(ChanakyaConfig):
    DEBUG=True
    SQLALCHEMY_DATABASE_URI = "mysql://root:root@localhost/chanakya"
    STAGES = {
    	'EKG': 'ENROLLMENT KEY GENERATE'
    }