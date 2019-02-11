'use strict';
const dot = require("dot");

module.exports = {
    incomingCallType: ['requestCallback', 'getEnrolmentKey'],
    studentStages: [
        'requestCallback',
        'enrolmentKeyGenerated',
        'stageXYZ',
        'stageABC'
    ],
    exotel: {
        sid: 'navgurukul',
        token: 'd8d7378e5eaa22ebf345a62dd391c479aeedb440',
        senderId: 'NAVGUR'
    },
    smsTemplates: {
        requestCallback: dot.template("Hi requestCallback, your number 9855517171 is now turned on."),
        enrolmentKeyGenerated: dot.template("Hi {{=it.key}}, your number 9855517171 is now turned on.")
    },
    questions: {
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
    },
    apiBaseUrl: "http://localhost:3000",
    aws: {
        s3: {
            accessKey: 'AKIAIHDYG5XSIQD3TVGQ',
            secretKey: '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',
            defaultBucket: 'chanakya-dev',
            defaultBucketBaseURL: 'https://s3.ap-south-1.amazonaws.com/chanakya-dev',
            apiVersion: '2006-03-01',
        }
    }
}
