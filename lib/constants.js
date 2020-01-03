const Dotenv = require('dotenv');

Dotenv.config({ path: `${__dirname}/../.env` });

const smsTemplates = require('./helpers/smsTemplates');

const commonConnfig = require('./config');

const {
  studentStages, feedbackableStages, caste, religon, qualification, currentStatus,
  feedbackableStagesData,
} = commonConnfig;

module.exports = {
  incomingCallType: ['requestCallback', 'getEnrolmentKey'],

  users: {
    jwt: {
      secret: process.env.JWT_SIGNING_SECRET,
      expiresIn: '7d',
    },
    auth: {
      googleClientID: process.env.GOOGLE_AUTH_CLIENT_ID,
    },
  },

  userTypes: {
    team: 1,
    student: 2,
    partner: 3,
  },

  studentStages,
  feedbackableStages,
  feedbackableStagesData,
  studentTypeOfData: ['requestCallback', 'softwareCourse'],
  feedbackType: ['rqcCallFeedback', 'tutionGroupFeedback', 'algIntCallFeedback', 'reAlgIntFeedback', 'cultFitCallRawInfo', 'englishIntCallFeedback', 'parentConversation', 'travelPlanning'],
  feedbackState: ['pass', 'failed', 'pending', 'forReview', 'done', 'need further action'],
  feedbackUser: ['team', 'student'],

  // some stages like demo, droppedOut, testFailed are final stages after which student
  // cannot go further in the pipeline. live stages are stages which can move ahead.
  // not considering probation and waitlisted stages are live stages for this.

  liveStudentStages: [

    'completedTest',
    'testPassed',

    'pendingAlgebraInterview',
    'pendingAlgebraReInterview', // algebra re-interview
    'forReviewAlgebraInterviewDone',

    'pendingEnglishInterview',
    'forReviewEnglishInterview',

    'pendingCultureFitInterview',
    'forReviewCultureFitInterviewDone',

    'pendingParentConversation',

    'pendingTravelPlanning',
    'finalisedTravelPlans',

  ],
  // a student will be considered as a stale record if the stage hasn't been changed
  // since the specified days

  staleRecordThreshold: 5,

  // the first date from which the metric calculation should start
  metricCalculationStartDate: '2019-02-19',
  metricCalcCron: '*/10 * * * *',
  testResultCron: '* */4 * * *',
  deadlineResultCron: '0 * * * *',

  typeOfTest: [
    // tracking students type of test
    'onlineTest',
    'offlineTest',
  ],

  testCutOff: {
    female: {
      v1: 19,
      v2: 15,
      v3: 13,
    },
    male: {
      v1: 21,
      v2: 15,
      v3: 15,
    },
    trans: {
      v1: 19,
      v2: 15,
      v3: 13,
    },
  },

  deadline: {
    beforeDeadline: 6,
    afterDeadline: 2,
  },

  rqcOwnerTribe: [
    // defining all tribe name for assign equal amount of works for mobilization.
    'Neerja',
    'APJ',
    'Razia Sultana',
    'Faiz',
    'Muktibodh',
    'Pash',
    'Manto',
  ],

  exotel: {
    sid: process.env.EXOTEL_SID,
    token: process.env.EXOTEL_TOKEN,
    senderId: process.env.EXOTEL_SENDER_ID,
  },

  smsTemplates,

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
    caste,
    religon,
    qualification,
    currentStatus,
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
    partnerSheetName: 'Partners',
    // the email where the report needs to be sent
    emailReport: {
      to: ['r@navgurukul.org', 'varatha@navgurukul.org', 's@navgurukul.org'],
      cc: ['r@navgurukul.org'],
      subject: 'Chanakya & gSheet just got sycned. Here is the report :)',
      syncReportHTMLReport: `${__dirname}/helpers/templates/syncReport.html`,
      userReport: `${__dirname}/helpers/templates/userReport.html`,
      userSubject: 'User Logged in report',
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

  mode: process.env.NODE_ENV,
  supportedModes: {
    prod: 'production',
    dev: 'development',
  },
};
