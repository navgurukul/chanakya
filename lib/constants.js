'use strict';
const dot = require('dot');
dot.templateSettings.strip = false;

const Dotenv = require('dotenv');
Dotenv.config({ path: `${__dirname}/../.env` });


let internals = {}
internals.genEnrolKeySMS = `NavGurukul ki scholarship ke liye apply karne ke liye, thank you.

Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/k/{{=it.key}} kholein aur test ko de. Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.

NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.

Test ke liye best of luck :) Test ke baad hum aap ko call kar kar, aage ke steps batayenge.`

internals.rqcSMS = `NavGurukul ki helpline mein call karne ke liye thanks :)

NavGurukul ki taraf se aapko koi jald hi call karge aur aap unse apne saare savaal pooch sakte hain. Tab tak aap aur samajhne ke liye aap yeh video dekh sakte hain - http://bit.ly/navgurukul-intro

Agar aapne test dena tha toh helpline pe dubara call kar ke 2 dabaiye.`



module.exports = {
    incomingCallType: ['requestCallback', 'getEnrolmentKey'],
    studentStages: [
        'requestCallback',
        'enrolmentKeyGenerated',
        'completedTest',
        'pendingCallbackForQuery',
        'forReviewCallbackQueryResolved',
        'queryResolvedAfterCallback',
        'testPassed',
        'testFailed',
        'pendingAlgebraInterview',
        'forReviewAlgebraInterviewDone',
        'pendingAlgebraReInterview',
        'algebraInterviewFail',
        'algebraInterviewWaitlisted',
        'pendingCultureFitInterview',
        'forReviewCultureFitInterviewDone',
        'pendingEnglishInterview',
        'forReviewEnglishInterview',
        'englishInterviewFail',
        'cultureFitInterviewWaitlisted',
        'cultureFitInterviewFail',
        'pendingParentConversation',
        'parentConversationFail',
        'pendingTravelPlanning',
        'finalisedTravelPlans',
        'probation',
        'finallyJoined',
        'droppedOut',
        'becameDisIntersested',
        'possibleDuplicate',
        'needAction',
        'demo',
        'disqualifiedUnreachable',
        'englishInterviewWaitlisted',
        'sentBackAfterProbation'
    ],
    exotel: {
        sid: process.env.EXOTEL_SID,
        token: process.env.EXOTEL_TOKEN,
        senderId: process.env.EXOTEL_SENDER_ID
    },
    smsTemplates: {
        requestCallback: dot.template(internals.rqcSMS),
        enrolmentKeyGenerated: dot.template(internals.genEnrolKeySMS)
    },
    studentDetails: {
        schoolMedium: {
            en: 1,
            other: 2
        },
        gender: {
            female: 1,
            male: 2,
            trans: 3
        },
        caste: {
            obc: 1,
            scSt: 2,
            general: 3,
            others: 4
        },
        religon: {
            hindu: 1,
            islam: 2,
            sikh: 3,
            jain: 4,
            christian: 5,
            others: 6
        },
        qualification: {
            lessThan10th: 1,
            class10th: 2,
            class12th: 3,
            graduate: 4
        },
        currentStatus: {
            nothing: 1,
            job: 2,
            study: 3,
            other: 4
        },
        states: {
            'AN': 'Andaman and Nicobar Islands',
            'AP': 'Andhra Pradesh',
            'AR': 'Arunachal Pradesh',
            'AS': 'Assam',
            'BR': 'Bihar',
            'CH': 'Chandigarh',
            'CT': 'Chhattisgarh',
            'DN': 'Dadra and Nagar Haveli',
            'DD': 'Daman and Diu',
            'DL': 'Delhi',
            'GA': 'Goa',
            'GJ': 'Gujarat',
            'HR': 'Haryana',
            'HP': 'Himachal Pradesh',
            'JK': 'Jammu and Kashmir',
            'JH': 'Jharkhand',
            'KA': 'Karnataka',
            'KL': 'Kerala',
            'LD': 'Lakshadweep',
            'MP': 'Madhya Pradesh',
            'MH': 'Maharashtra',
            'MN': 'Manipur',
            'ML': 'Meghalaya',
            'MZ': 'Mizoram',
            'NL': 'Nagaland',
            'OR': 'Odisha',
            'PY': 'Puducherry',
            'PB': 'Punjab',
            'RJ': 'Rajasthan',
            'SK': 'Sikkim',
            'TN': 'Tamil Nadu',
            'TG': 'Telangana',
            'TR': 'Tripura',
            'UT': 'Uttarakhand',
            'UP': 'Uttar Pradesh',
            'WB': 'West Bengal'
        }
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
            integer: 2
        },
        difficulty: {
            easy: 1,
            medium: 2,
            hard: 3
        },
        topics: [
            // older topics
            "Basic Math",
            "Abstract Reasoning",
            "Non Verbal Reasoning",
            // newer topics
            "Percentage",
            "Unitary Method",
            "Algebra",
            "Mathematical Patterns"
        ],
        markingScheme: {
            easy: 1,
            medium: 2,
            hard: 3
        },
        assessmentConfig: [
            {
                topic: "Mathematical Patterns",
                difficulty: {
                    easy: 1,
                    medium: 2,
                    hard: 1
                },
                sortedByDifficulty: true
            },
            {
                bucketName: "Percentage",
            },
            {
                bucketName: "Unitary Method",
            },
            {
                bucketName: "Algebra"
            }
        ],
        timeAllowed: 60 * 60 // in seconds
    },
    apiBaseUrl: process.env.API_BASE_URL,
    gSheet: {
        clientEmail: process.env.GSHEET_CLIENT_EMAIL,
        privateKey: process.env.GSHEET_PRIVATE_KEY,
        sheetId: process.env.GSHEET_ID,
        // this should be an exact string match. it is case sensitive
        mainSheetName: "Main Data",
        // the email where the report needs to be sent
        emailReport: {
            to: ['r@navgurukul.org', 'varatha@navgurukul.org'],
            cc: [],
            subject: "Chanakya & gSheet just got sycned. Here is the report :)"
        }
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
            charset: "UTF-8"
        }
    }
}
