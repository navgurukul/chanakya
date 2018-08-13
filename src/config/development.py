from ..config import ChanakyaConfig

class DevelopmentConfig(ChanakyaConfig):
    DEBUG=True
    SQLALCHEMY_DATABASE_URI = "mysql://root:kuchbhiyaar@localhost/chanakya"
