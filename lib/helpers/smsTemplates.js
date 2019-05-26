'use strict';

const dot = require('dot');
dot.templateSettings.strip = false;

let smsTemplates = {}

smsTemplates.genEnrolKeySMS = `NavGurukul ki scholarship ke liye apply karne ke liye, thank you.

Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/k/{{=it.key}} kholein aur test ko de. Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.

NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.

Test ke liye best of luck :) Test ke baad hum aap ko call kar kar, aage ke steps batayenge.`



smsTemplates.rqcSMS = `NavGurukul ki helpline mein call karne ke liye thanks :)

NavGurukul ki taraf se aapko koi jald hi call karge aur aap unse apne saare savaal pooch sakte hain. Tab tak aap aur samajhne ke liye aap yeh video dekh sakte hain - http://bit.ly/navgurukul-intro

Agar aapne test dena tha toh helpline pe dubara call kar ke 2 dabaiye.`

smsTemplates.completedTest = `NavGurukul mein aapka test complete hua.`

module.exports = {
    // should contain the stages from the Array studentStages in constant.js
    requestCallback: dot.template(smsTemplates.rqcSMS),
    enrolmentKeyGenerated: dot.template(smsTemplates.genEnrolKeySMS),
    completedTest: dot.template(smsTemplates.completedTest),
    testFailed: dot.template('failed'),
    testPassed: dot.template('passed')
};
