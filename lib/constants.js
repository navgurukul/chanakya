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
    }
}
