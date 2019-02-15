'use strict';
const dot = require('dot');
const Dotenv = require('dotenv');
Dotenv.config({ path: `${__dirname}/../.env` });

console.log(process.env);

module.exports = {
    incomingCallType: ['requestCallback', 'getEnrolmentKey'],
    studentStages: [
        'requestCallback',
        'enrolmentKeyGenerated',
        'stageXYZ',
        'stageABC'
    ],
    exotel: {
        sid: process.env.EXOTEL_SID,
        token: process.env.EXOTEL_TOKEN,
        senderId: process.env.EXOTEL_SENDER_ID
    },
    smsTemplates: {
        requestCallback: dot.template("Hi requestCallback, your number 9855517171 is now turned on."),
        enrolmentKeyGenerated: dot.template("Hi {{=it.key}}, your number 9855517171 is now turned on.")
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
            "Basic Math",
            "Abstract Reasoning",
            "Non Verbal Reasoning"
        ],
        markingScheme: {
            easy: 1,
            medium: 2,
            hard: 3
        },
        assessmentConfig: {
            "Basic Math": { easy: 3, medium: 3, hard: 3 },
            "Abstract Reasoning": { easy: 2, medium: 2, hard: 2 },
            "Non Verbal Reasoning": { easy: 1, medium: 1, hard: 1 },
        },
        timeAllowed: 60 * 60 // in seconds
    },
    apiBaseUrl: process.env.API_BASE_URL,
    aws: {
        s3: {
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_KEY,
            defaultBucket: process.env.S3_BUCKET,
            defaultBucketBaseURL: process.env.S3_BUCKET_BASE_URL + process.env.S3_BUCKET,
            apiVersion: '2006-03-01',
        }
    }
}
