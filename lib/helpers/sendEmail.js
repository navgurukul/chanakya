const AWS = require('aws-sdk');
// Set the region
const CONSTANTS = require('../constants');
const _ = require('underscore');

const SESEmail = (receiverEmails, text, CcEmails = [], subject = '', isHtmlText = false) => {
	AWS.config.update({
		region: 'us-east-1',
		accessKeyId: CONSTANTS.aws.ses.accessKey,
		secretAccessKey: CONSTANTS.aws.ses.secretKey,
	});

	let params = {
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

	params['Message']['Body'][isHtmlText ? 'Html' : 'Text'] = {
		Charset: CONSTANTS.aws.ses.charset,
		Data: text,
	};

	// Create the promise and SES service object
	const sesParam = {
		apiVersion: CONSTANTS.aws.ses.apiVersion,
	};
	let sendPromise = new AWS.SES(sesParam).sendEmail(params).promise();

	// Handle promise's fulfilled/rejected states
	return sendPromise
		.then(function(data) {
			return Promise.resolve();
		})
		.catch(function(err) {
			console.error(err, err.stack);
			return Promise.reject();
		});
};

const getEnrolmentKeysErrorsMessage = platform => {
	let errorMessages = '';
	_.each(platform.enrolmentKeys, row => {
		errorMessages += `\n Key ${row.key.key} has ${row.errors.length} problems: \n`;
		_.each(row.errors, errorMessage => {
			errorMessages += `\t- ${errorMessage}\n`;
		});
	});

	return errorMessages;
};

const getIncomingCallsErrorsMessage = platform => {
	let errorMessages = '';
	_.each(platform.incomingCalls, row => {
		errorMessages += `\n Incoming Call Id ${row.id} has ${row.errors.length} problems: \n`;
		_.each(row.errors, errorMessage => {
			errorMessages += `\t- ${errorMessage}\n`;
		});
	});

	return errorMessages;
};

const getPlatformSyncErrorMessage = syncErrors => {
	const { platform } = syncErrors;
	let syncErrorReport = '';
	totalErrors = platform.enrolmentKeys.length + platform.incomingCalls.length;

	// errors while syncing chanakya from gSheet
	if (totalErrors === 0) {
		syncErrorReport = 'No Error in syncing chanakya from google Sheet.';
	} else {
		syncErrorReport += `Total ${totalErrors} rows had problem while syncing chanakya.\n`;
		syncErrorReport += getEnrolmentKeysErrorsMessage(platform);
		syncErrorReport += getIncomingCallsErrorsMessage(platform);
	}

	return syncErrorReport;
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
const sendEmailReport = reports => {
	let emailReport = '';
	emailReport += `Total enrolmentKeys Added ${reports.keysAdded}.\n`;
	emailReport += `Total incomingCalls Added ${reports.incomingCallAdded}.\n`;
	const { syncErrors } = reports;
	emailReport += getPlatformSyncErrorMessage(syncErrors);

	const receiverEmails = CONSTANTS.gSheet.emailReport.to;
	const CcEmails = CONSTANTS.gSheet.emailReport.cc;
	const subject = CONSTANTS.gSheet.emailReport.subject;

	return SESEmail(receiverEmails, emailReport, CcEmails, subject);
};

module.exports = {
	sendEmailReport: sendEmailReport,
	SESEmail: SESEmail,
};
