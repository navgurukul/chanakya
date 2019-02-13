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
    studentDetails: {
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
