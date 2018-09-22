"""
    This file helps with all the upload of file to s3.

"""

import boto3
from botocore.client import Config
from werkzeug.datastructures import FileStorage
from flask_restplus import reqparse
from chanakya.src import app
from werkzeug.utils import secure_filename
import uuid


def upload_file_to_s3( bucket_name, file=None, folder=None, string=None, filename_extension=None):
    """
        The function helps to upload any file on AWS in a specified bucket.

        Params:
        - `file`: it takes the FileStorage instance of the file which contains every details(default=None)
        - `string`: it takes a data in either string or bytes(default=None)
        - `filename_extension`: The extension of the file(default=None) ['pdf', 'csv']
        - `bucket_name`: Name of the bucket where the file should be uploaded default from the config
        - `folder` (defaults to None): Name of the folder. Will append this in front of the filename.
                                     Should not have a trailing slash. Example: 'folder1/subfolder'

        Returns the S3 url of the uploaded file.


        *Note: Either file or string must be passed.
               If you are passing string you also have to pass a filename_extension param*
    """

    # if the FileStorage object is passed
    # get file extension
    if file:
        filename_extension = secure_filename(file.filename).split('.')[-1]

    # generate a uuid based file name to avoid conflicts
    random_string = str(uuid.uuid4())
    file_name = random_string + '.' + filename_extension

    # connecting with the s3 instance with upload the file
    session = boto3.Session(
        aws_access_key_id=app.config['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=app.config['AWS_SECRET_ACCESS_KEY']
    )
    s3 = session.resource('s3', config=Config(signature_version='s3v4'))

    # append the folder name if folder is specified
    if folder:
        file_name = '/'.join([folder, file_name])

    # if uploading the file with FileStorage instance
    if file:
        s3.meta.client.upload_fileobj(
            file,
            bucket_name,
            file_name,
            ExtraArgs={
                "ContentType": app.config['FILE_CONTENT_TYPES'][filename_extension]
            }
        )
    # if uploading the data of the file which is in string or bytes
    else:
        s3.meta.client.put_object(
            Bucket=bucket_name,
            Key=file_name,
            Body=string,
            ContentType= app.config['FILE_CONTENT_TYPES'][filename_extension]
        )
    return 'http://{0}.s3.amazonaws.com/{1}'.format(bucket_name, file_name)




class FileStorageArgument(reqparse.Argument):
    """
        This argument class for flask-restplus will be used in
        all cases where file uploads need to be handled.
    """

    def convert(self, value, op):
        if self.type is FileStorage:  # only in the case of files
            # this is done as self.type(value) makes the name attribute of the
            # FileStorage object same as argument name and value is a FileStorage
            # object itself anyways
            return value

        # called so that this argument class will also be useful in
        # cases when argument type is not a file.
        super(FileStorageArgument, self).convert(*args, **kwargs)
