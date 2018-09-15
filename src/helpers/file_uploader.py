import boto3
from botocore.client import Config
from werkzeug.datastructures import FileStorage
from flask_restplus import reqparse
from chanakya.src import app
from werkzeug.utils import secure_filename
import uuid
from io import BytesIO


def upload_file_to_s3(file, bucket_name = app.config['S3_QUESTION_IMAGES_BUCKET']):
    '''
    The function helps to upload any file on AWS s3 which accesibile publicily to anyone using the
    key_id,secret key in config file and boto3
    params:
    - file : it takes the FileStorage instance of the file which contains every details
    - bucket_name : Name of the bucket where the file should be uploaded default from the config
    - acl : Access control list which allows the file to be public or private, read or write default is public-read only

    it return a url of the file after uploading the file to s3 to be accesibile

    url : http://<bucketname>.s3.amazonaws.com/<filename>
    '''

    #filename
    filename_extension = secure_filename(file.filename).split('.')[-1]
    random_string = str(uuid.uuid4())
    filename = random_string + '.' + filename_extension

    #connecting with the s3 instance with upload the file

    session = boto3.Session(
        aws_access_key_id=app.config['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=app.config['AWS_SECRET_ACCESS_KEY']
    )

    s3 = session.resource('s3', config=Config(signature_version='s3v4'))
    #file upload using the connection
    try:
        s3.meta.client.upload_fileobj(
            file,
            bucket_name, #default in the config
            filename,
            ExtraArgs={
                "ContentType": app.config['FILE_CONTENT_TYPES'][filename_extension]
            }
        )

    except Exception as e:
        # This is a catch all exception, edit this part to fit your needs.
        print("Something Happened: ", e)
        raise e
    return '{0}{1}'.format(app.config['AWS_LOCATION'], filename)


def upload_pdf_to_s3(string, bucket_name = app.config['S3_QUESTION_IMAGES_BUCKET']):
    '''
    The function helps to upload any file on AWS s3 which accesibile publicily to anyone using the
    key_id,secret key in config file and boto3
    params:
    - string : it takes binary string and upload as a pdf on s3
    - bucket_name : Name of the bucket where the file should be uploaded default from the config
    - acl : Access control list which allows the file to be public or private, read or write default is public-read only

    it return a url of the file after uploading the file to s3 to be accesibile

    url : http://<bucketname>.s3.amazonaws.com/<filename>
    '''
    #filename
    filename_extension = 'pdf'
    random_string = str(uuid.uuid4())
    filename = random_string + '.' + filename_extension

    #connecting with the s3 instance with upload the file
    session = boto3.Session(
        aws_access_key_id=app.config['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=app.config['AWS_SECRET_ACCESS_KEY']
    )

    s3 = session.resource('s3', config=Config(signature_version='s3v4'))

    # byte_object_handler = BytesIO(string)
    #file upload using the connection
    try:
        s3.meta.client.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=string,
            ContentType= app.config['FILE_CONTENT_TYPES'][filename_extension]
        )
    except Exception as e:
        # This is a catch all exception, edit this part to fit your needs.
        print("Something Happened: ", e)
        raise e
    return '{0}{1}'.format(app.config['AWS_LOCATION'], filename)


class FileStorageArgument(reqparse.Argument):
    """This argument class for flask-restful will be used in
    all cases where file uploads need to be handled."""

    def convert(self, value, op):
        if self.type is FileStorage:  # only in the case of files
            # this is done as self.type(value) makes the name attribute of the
            # FileStorage object same as argument name and value is a FileStorage
            # object itself anyways
            return value

        # called so that this argument class will also be useful in
        # cases when argument type is not a file.
        super(FileStorageArgument, self).convert(*args, **kwargs)
