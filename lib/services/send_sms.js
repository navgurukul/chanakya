const Schmervice = require("schmervice");
const fs = require("fs");
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
const path = require('path');
const CONSTANTS = require('../constants');

module.exports = class sendingSmsToStudents extends Schmervice.Service {
  async prepareSmsTemplate(id) {
    const { Student } = this.server.models();
    const studentDetails = await Student.query()
      .select('name', 'stage')
      .where({ id })
      .withGraphFetched('school')
      .withGraphFetched('feedbacks');
    let templateName;
    if (studentDetails[0].stage === 'pendingEnglishInterview') {
      templateName = 'online_test_pass.txt';
    } else if (studentDetails[0].stage === 'testFailed') {
      templateName = 'online_test_fail.txt';
    } else if (studentDetails[0].stage === 'offerLetterSent') {
      templateName = 'sent_offer_letter_sms.txt';
    } else if (studentDetails[0].stage !== '') {
      templateName = 'sent_stage_notification.txt';
    }
    const smsTemplate = fs.readFileSync(path.join(__dirname,'../../sms_templates',templateName),'utf8');
    const replacedName = smsTemplate.replace('<Student Name>', studentDetails[0]?.name);
    const replacedStage = replacedName.replace('<Stage Name>', studentDetails[0]?.stage);
    const replacedStatus = replacedStage.replace('<status>', studentDetails[0]?.feedbacks?.state);
    const replacedSchool = replacedStatus.replace(
      '<School Name>',
      studentDetails[0]?.school[0]?.name
    );
    const formattedData = replacedSchool.replace(/\n/g, '\n\n');
    return formattedData;
  }
  async getStage(id) {
    const { Student } = this.server.models();
    try {
      const stage = await Student.query().select('stage').where({id})
      return stage[0].stage
    } catch (error) {
      return error
    }
  }
  async sendSmsToStudents(formattedData, id) {
    const { Contact } = this.server.models();
    const phone_num = await Contact.query().select('mobile').where('student_id', id)
    try {
      // Configure AWS credentials and region
      AWS.config.update({
        accessKeyId: CONSTANTS.sendSmsByStages.awsAccessKeyId,
        secretAccessKey: CONSTANTS.sendSmsByStages.awsSecretAccessKey,
        region: CONSTANTS.sendSmsByStages.awsRegion,
      });
      // Create a new instance of the SNS service
      const sns = new AWS.SNS();
      // Send the SMS using Amazon SNS
      const params = {
        Message: formattedData,
        PhoneNumber: `+91${phone_num[0].mobile}` // Replace with the appropriate country code if needed
      };
      await sns.publish(params).promise();
      console.log('SMS sent successfully!');
    } catch (err) {
      console.error('Failed to send SMS:', err);
    }
  }

  async sendEmailToStudents(notificationContent, id) {
    try {
      const { Student } = this.server.models();
      const studentDetails = await Student.query().select('email').where({ id });
      // Create a transporter using SMTP
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: CONSTANTS.emailCredentials.user,
          pass: CONSTANTS.emailCredentials.pass,
        },
      });

      // Email options
      const mailOptions = {
        from: 'ujjwalkashyap97987@gmail.com',
        to: studentDetails[0].email,
        subject: 'Admission Status Update',
        text: notificationContent,
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Mein hu Error:', error);
          return false;
        }
      });
      return true;
    } catch (err) {
      console.error('Failed to send Email:', err);
      return false;
    }
  }
};
