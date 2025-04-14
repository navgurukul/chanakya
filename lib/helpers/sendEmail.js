const AWS = require('aws-sdk');
const fs = require('fs');
const handleBar = require('./handleBarsConfig');
const CONSTANTS = require('../constants');
const Dotenv = require('dotenv');
Dotenv.config({ path: `${__dirname}/../.env` });


const path = require('path');
const handlebars = require('handlebars');

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

const SESEmailToUsers = async (
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
    Source: process.env.OTP_SENDER_EMAIL 
    /* required */,
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

const sendOTPViaEmail = async (email, otp) => {
  try {

    // Correct path to the OTP email template
    const templatePath = path.join(__dirname, '../helpers/templates/otpEmailTemplate.html');

    // Read the OTP email template
    const source = fs.readFileSync(templatePath, 'utf-8');

    // Compile the template
    const template = handlebars.compile(source);

    // Pass OTP dynamically (Ensure the key matches the placeholder in the template)
    const htmlString = template({ OTP: otp });  // Use 'OTP' to match '{{OTP}}' in the template

    // Define the email subject
    const subject = 'Your One-Time Password (OTP)';

    await SESEmailToUsers([email], htmlString, [], subject, true);
    return { status: 'success', statusCode: 200, message: 'OTP has been sent to your email address' };
  } catch (error) {
    console.error("Error sending OTP via email:", error);
    return error;
  }
};


// const sendEmailToUsersForUpdateStage = async (name, email, stage) => {
//   try {
//     let templatePath;
//     let subject;
//     if (stage === 'algebraInterviewFail') {
//       templatePath = path.join(__dirname, '../helpers/templates/academicInterviewNotCleared15Days.html');
//       subject = 'Regarding Your Academic Interview: Next Steps';
//     }

//     if (stage === 'tuitionGroup') {
//       templatePath = path.join(__dirname, '../helpers/templates/academicInterviewNotCleared7Days.html');
//       subject = 'Regarding Your Academic Interview: Next Steps';
//     }

//     if (stage === 'selectedAndJoiningAwaited') {
//       templatePath = path.join(__dirname, '../helpers/templates/cultureFitInterviewPassed.html');
//       subject = 'Congratulations! You have Cleared the Culture Fit Interview!';
//     }

//     if (stage === 'pendingCultureFitInterview'){
//       templatePath = path.join(__dirname, '../helpers/templates/academicInterviewPassed.html');
//       subject = 'Academic Interview Passed: Culture Fit Interview Pending';
//     }

//     const source = fs.readFileSync(templatePath, 'utf-8');
//     const template = handlebars.compile(source);
//     const htmlString = template({ Name: name });

//     await SESEmailToUsers([email], htmlString, [], subject, true);
//     return { status: 'success', statusCode: 200, message: 'Email has been sent to the user' };
//   } catch (error) {
//     console.error("Error sending email to users for update stage:", error);
//     return error;
//   }
// }


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
  sendOTPViaEmail,
  // sendEmailToUsersForUpdateStage
};
