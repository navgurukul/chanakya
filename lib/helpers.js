const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const CONSTANTS = require('./constants');

exports.uploadToS3 = async (fileObj, fileLocation = '') => {
  const S3Bucket = new AWS.S3({
    accessKeyId: CONSTANTS.aws.s3.accessKey,
    secretAccessKey: CONSTANTS.aws.s3.secretKey,
    Bucket: CONSTANTS.aws.s3.defaultBucket,
    apiVersion: CONSTANTS.aws.s3.apiVersion,
  });
  const key = `${fileLocation}/${uuidv4()}-${fileObj.hapi.filename}`;
  try {
    await S3Bucket.putObject({
      Bucket: CONSTANTS.aws.s3.defaultBucket,
      Key: key,
      Body: fileObj._data,
      ContentType: fileObj.hapi.headers['content-type'],
    }).promise();
  } catch (e) {
    throw new Error(e);
  }
  return `${CONSTANTS.aws.s3.defaultBucketBaseURL}/${key}`;
};
