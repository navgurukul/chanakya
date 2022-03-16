const AWS = require('aws-sdk');
const fs = require('fs');
const handleBar = require('./handleBarsConfig');
const CONSTANTS = require('../constants');

const SESEmail = async (
  receiverEmails,
  text,
  CcEmails = [],
  subject = '',
  isHtmlText = false
) => {
  AWS.config.update({
    region: 'us-east-1',
    accessKeyId: CONSTANTS.aws.ses.accessKey,
    secretAccessKey: CONSTANTS.aws.ses.secretKey,
  });

  const params = {
    Destination: {
      /* required */
      CcAddresses: CcEmails,
      ToAddresses: receiverEmails,
    },
    Message: {
      /* required */
      Body: {
        /* required */
      },
      Subject: {
        Charset: CONSTANTS.aws.ses.charset,
        Data: subject,
      },
    },
    Source: CONSTANTS.aws.ses.senderEmail /* required */,
  };

  params.Message.Body[isHtmlText ? 'Html' : 'Text'] = {
    Charset: CONSTANTS.aws.ses.charset,
    Data: text,
  };

  // Create the promise and SES service object
  const sesParam = {
    apiVersion: CONSTANTS.aws.ses.apiVersion,
  };
  const sendPromise = new AWS.SES(sesParam).sendEmail(params).promise();
  const res = await sendPromise;
  return res;
};

/**
 *
 * @param {
 *          keysAdded: 0, // Total number of new keys added
            incomingCallAdded: 0, // Total number of new incoming call added

            syncErrors: {

                // errors while syncing the platform with gSheet
                platform : {
                    enrolmentKeys: [], // {key: 'EDT567', errors: ['errors']}
                    incomingCalls: []  // {id: 3, errors: ['errors']}
                },
            }
 * } reports
 */
const sendEmailReport = (reports) => {
  const source = fs.readFileSync(
    CONSTANTS.gSheet.emailReport.syncReportHTMLReport,
    'utf-8'
  );
  const htmlString = handleBar.compile(source)(reports);
  const receiverEmails = CONSTANTS.gSheet.emailReport.to;
  const CcEmails = CONSTANTS.gSheet.emailReport.cc;
  const { subject } = CONSTANTS.gSheet.emailReport;
  return SESEmail(receiverEmails, htmlString, CcEmails, subject, true);
};

const sendPartnersReports = (reports, reciverEmails) => {
  const source = fs.readFileSync(
    CONSTANTS.gSheet.partnerEmailReport.syncReportHTMLReport,
    'utf-8'
  );
  const htmlString = handleBar.compile(source)(reports);
  const { subject } = CONSTANTS.gSheet.partnerEmailReport;
  return SESEmail(reciverEmails, htmlString, [], subject, true);
};

module.exports = {
  sendEmailReport,
  SESEmail,
  sendPartnersReports,
};
