'use strict';

const Dotenv = require('dotenv');
Dotenv.config({ path: `${__dirname}/../.env` });

const smsTemplates = require('./helpers/smsTemplates');

module.exports = {
	incomingCallType: ['requestCallback', 'getEnrolmentKey'],
	studentStages: [
		// related to the mcq test
		'enrolmentKeyGenerated',
		'completedTest',
		'testPassed',
		'testFailed',

		// related to incoming query calls
		'requestCallback',
		'pendingCallbackForQuery',
		'forReviewCallbackQueryResolved',
		'queryResolvedAfterCallback',

		// algebra interviews
		'pendingAlgebraInterview',
		'pendingAlgebraReInterview', // algebra re-interview
		'forReviewAlgebraInterviewDone',
		'algebraInterviewFail',
		'algebraInterviewWaitlisted',

		// english interviews
		'pendingEnglishInterview',
		'forReviewEnglishInterview',
		'englishInterviewFail',
		'englishInterviewWaitlisted',

		// culture fit interviews
		'pendingCultureFitInterview',
		'forReviewCultureFitInterviewDone',
		'cultureFitInterviewWaitlisted',
		'cultureFitInterviewFail',

		// parent conversations
		'pendingParentConversation',
		'parentConversationFail',

		// travel planning
		'pendingTravelPlanning',
		'finalisedTravelPlans',

		// probation etc. once when the student has joined navgurukul
		'probation',
		'finallyJoined',
		'droppedOut',
		'sentBackAfterProbation',

		// is not reachable
		'becameDisIntersested',

		// random stages for internal use
		'possibleDuplicate',
		'needAction',
		'demo',
		'disqualifiedUnreachable',
	],
	cronSchedule: {
		second: 2,
		minute: 2,
		hour: 2,
		dayOfMonth: "*",
		month: "*",
		dayOfWeek: "*"
	},
	metrics: {
		liveStages: [
			// related to the mcq test
			'enrolmentKeyGenerated',
			'completedTest',
			'testPassed',
			'testFailed',
			
			// related to incoming query calls
			'requestCallback',
			'pendingCallbackForQuery',
			'forReviewCallbackQueryResolved',
			'queryResolvedAfterCallback',
			
			// algebra interviews
			'pendingAlgebraInterview',
			'pendingAlgebraReInterview', // algebra re-interview
			'forReviewAlgebraInterviewDone',
			'algebraInterviewWaitlisted',
			
			// english interviews
			'pendingEnglishInterview',
			'forReviewEnglishInterview',
			'englishInterviewWaitlisted',

			// culture fit interviews
			'pendingCultureFitInterview',
			'forReviewCultureFitInterviewDone',
			'cultureFitInterviewWaitlisted',
			
			// parent conversations
			'pendingParentConversation',
			'parentConversationFail',
			
			// travel planning
			'pendingTravelPlanning',
			'finalisedTravelPlans',
		],
		staleRecordThresold: 7,
	},
	typeOfTest: [
		// tracking students type of test
		'onlineTest',
		'offlineTest',
	],
	exotel: {
		sid: process.env.EXOTEL_SID,
		token: process.env.EXOTEL_TOKEN,
		senderId: process.env.EXOTEL_SENDER_ID,
	},
	smsTemplates: smsTemplates,
	studentDetails: {
		schoolMedium: {
			en: 1,
			other: 2,
		},
		gender: {
			female: 1,
			male: 2,
			trans: 3,
		},
		caste: {
			obc: 1,
			scSt: 2,
			general: 3,
			others: 4,
		},
		religon: {
			hindu: 1,
			islam: 2,
			sikh: 3,
			jain: 4,
			christian: 5,
			others: 6,
		},
		qualification: {
			lessThan10th: 1,
			class10th: 2,
			class12th: 3,
			graduate: 4,
		},
		currentStatus: {
			nothing: 1,
			job: 2,
			study: 3,
			other: 4,
		},
		states: {
			AN: 'Andaman and Nicobar Islands',
			AP: 'Andhra Pradesh',
			AR: 'Arunachal Pradesh',
			AS: 'Assam',
			BR: 'Bihar',
			CH: 'Chandigarh',
			CT: 'Chhattisgarh',
			DN: 'Dadra and Nagar Haveli',
			DD: 'Daman and Diu',
			DL: 'Delhi',
			GA: 'Goa',
			GJ: 'Gujarat',
			HR: 'Haryana',
			HP: 'Himachal Pradesh',
			JK: 'Jammu and Kashmir',
			JH: 'Jharkhand',
			KA: 'Karnataka',
			KL: 'Kerala',
			LD: 'Lakshadweep',
			MP: 'Madhya Pradesh',
			MH: 'Maharashtra',
			MN: 'Manipur',
			ML: 'Meghalaya',
			MZ: 'Mizoram',
			NL: 'Nagaland',
			OR: 'Odisha',
			PY: 'Puducherry',
			PB: 'Punjab',
			RJ: 'Rajasthan',
			SK: 'Sikkim',
			TN: 'Tamil Nadu',
			TG: 'Telangana',
			TR: 'Tripura',
			UT: 'Uttarakhand',
			UP: 'Uttar Pradesh',
			WB: 'West Bengal',
		},
	},
	questions: {
		pdf: {
			quesPaperTemplate: `${__dirname}/helpers/templates/questionPdf.html`,
			answerKeyTemplate: `${__dirname}/helpers/templates/answerKeyPdf.html`,

			quesPaperHTMLPath: `${__dirname}/../currentQuesPaper.html`,
			quesPaperPDFPath: `${__dirname}/../currentQuesPaper.pdf`,

			answerKeyHTMLPath: `${__dirname}/../currentAnswerKey.html`,
			answerKeyPDFPath: `${__dirname}/../currentAnswerKey.pdf`,
		},
		types: {
			mcq: 1,
			integer: 2,
		},
		difficulty: {
			easy: 1,
			medium: 2,
			hard: 3,
		},
		topics: [
			// older topics
			'Basic Math',
			'Abstract Reasoning',
			'Non Verbal Reasoning',
			// newer topics
			'Percentage',
			'Unitary Method',
			'Algebra',
			'Mathematical Patterns',
		],
		markingScheme: {
			easy: 1,
			medium: 2,
			hard: 3,
		},
		assessmentConfig: [
			{
				topic: 'Mathematical Patterns',
				difficulty: {
					easy: 1,
					medium: 2,
					hard: 1,
				},
				sortedByDifficulty: true,
			},
			{
				bucketName: 'Percentage',
			},
			{
				bucketName: 'Unitary Method',
			},
			{
				bucketName: 'Algebra',
			},
		],
		timeAllowed: 90 * 60, // in seconds
	},
	apiBaseUrl: process.env.API_BASE_URL,
	gSheet: {
		clientEmail: process.env.GSHEET_CLIENT_EMAIL,
		privateKey: process.env.GSHEET_PRIVATE_KEY,
		sheetId: process.env.GSHEET_ID,
		// this should be an exact string match. it is case sensitive
		mainSheetName: 'Main Data',
		partnerSheetName: 'Partners',
		// the email where the report needs to be sent
		emailReport: {
			to: ['r@navgurukul.org', 'varatha@navgurukul.org'],
			cc: [],
			subject: 'Chanakya & gSheet just got sycned. Here is the report :)',
			syncReportHTMLReport: `${__dirname}/helpers/templates/syncReport.html`,
		},
	},
	aws: {
		s3: {
			accessKey: process.env.S3_ACCESS_KEY,
			secretKey: process.env.S3_SECRET_KEY,
			defaultBucket: process.env.S3_BUCKET,
			defaultBucketBaseURL: process.env.S3_BUCKET_BASE_URL + process.env.S3_BUCKET,
			apiVersion: '2006-03-01',
		},
		ses: {
			accessKey: process.env.SES_ACCESS_KEY,
			secretKey: process.env.SES_SECRET_KEY,
			apiVersion: '2010-12-01',
			senderEmail: process.env.SES_SENDER_EMAIL,
			charset: 'UTF-8',
		},
	},
	defaultValues: {
		paginationSize: 10,
	},
};
