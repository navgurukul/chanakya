
const dot = require('dot');

dot.templateSettings.strip = false;

const smsTemplates = {};

/** ******************************
****** incomign queyr calls *****
******************************* */

smsTemplates.rqcSMS = `NavGurukul ki helpline mein call karne ke liye thanks :)

NavGurukul ki taraf se aapko koi jald hi call karge aur aap unse apne saare savaal pooch sakte hain. Tab tak aap aur samajhne ke liye aap yeh video dekh sakte hain - http://bit.ly/navgurukul-intro

Agar aapne test dena tha toh helpline pe dubara call kar ke 2 dabaiye.`;

/** ******************************
**** related to the mcq test ***
****************************** */

smsTemplates.genEnrolKeySMS = `NavGurukul ki scholarship ke liye apply karne ke liye, thank you.

Iss test ko dene ke liye aap jald hi, yeh website - http://join.navgurukul.org/k/{{=it.key}} kholein aur test ko de. Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.

NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.

Test ke liye best of luck :) Test ke baad hum aap ko call kar kar, aage ke steps batayenge.`;

smsTemplates.completedTest = `NavGurukul ka test dene ke liye dhanyavad. Aapka saare answers humare paas aa chuke hain. Hum jaldi hi aapko aapke test ka result aur aage ke steps ke baare mein inform kar denge.

Tab ke liye all the best :) NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.`;

smsTemplates.testFailed = `Navgurukul mein test dene ke liye thank you. Sadly aapka yeh test clear nahi ho paya iss bar.

Aap thodi tyyari ke baad yeh test fir se de. Aap yeh study guide - https://bit.ly/2NgceEp - ka use kar sakte hai preparation ke liye. All the best :)`;

smsTemplates.testPassed = `NavGurukul ka test India mein hazaaron students dete hain. Aapne iss test mein acha kara hai aur aapko hum jaldi hi call karke agle steps ke baare mein batayenge.

Tab tak aapko agar NavGurukul ke baarein mein aur janna hai toh youtube par yeh video - http://bit.ly/navgurukul-intro dekhein

Congratulations :D We hope you do well in the next rounds too.`;

/** ******************************
****** algebra interviews ******
****************************** */

smsTemplates.pendingAlgebraInterview = `Aapne NavGurukul ki pichli interview mein bahot acha kia. Aap next round ke liye select ho gaye ho.

Agle steps ke liye hum aapko jaldi hi call karenge. Agar aapko kuch bhi questions hain toh aap uss time puch sakte ho.

Tab tak aapko agar NavGurukul ke baarein mein aur janna hai toh youtube par yeh video - http://bit.ly/navgurukul-intro dekhein

Congratulations :D All the best for the next round.`;

smsTemplates.pendingAlgebraReInterview = `Aapne abhi tak NavGurukul ke saare steps mein bahot acha kia hai. Hum jaldi hi aapse kuch aur cheezein puchne ke liye aapko call karenge.

Tab tak aapko agar NavGurukul ke baarein mein aur janna hai toh youtube par yeh video - http://bit.ly/navgurukul-intro dekhein

Congratulations :D All the best for the next round.`;

smsTemplates.algebraInterviewFail = `NavGurukul ka test India mein hazaaron students dete hain. Hum dil se koshish karte hain ki hum saare students ko software engineering padha sakein aur achi jobs dilva sakin.

Lekin kuch basic concepts zaroori hote hain iske liye jo hum apne test mein dekhte hain jo aapne kuch din pehle dia tha.

Sadly pichli interview mein aapka score kam tha, aur hum aage ki interviews ke liye ab aapko call nahi karenge.

Lekin yaad rakhiye ke yeh sirf ek test hai. Is mein acha ya bura karne se yeh decide nahi hota ki aap zindagi mein kaisa karoge. All the best :)

Agar aap agli baar NavGurukul ka test dena chahte ho toh apni Basic Maths (especially algebra) ki knowledge pe zyada kaam karne ki koshish karein.`;

smsTemplates.algebraInterviewWaitlisted = `NavGurukul ka test India mein hazaaron students dete hain. Hum dil se koshish karte hain ki hum saare students ko software engineering padha sakein aur achi jobs dilva sakin.

Lekin kabhi kabhi yeh faisla lena ki hum kisko bulayein bahot mushkil hota hai.

Isliye abhi humne aapka naam waitlist pe rakh dia hai algebra waali interview ke hisaab se. Agar aapse pehle waale kuch students mein se koi mana karta hain toh hum aapko zaroor update karenge.

Tab tak aapko agar NavGurukul ke baarein mein aur janna hai toh youtube par yeh video - http://bit.ly/navgurukul-intro dekhein`;

/** ******************************
****** english interviews *******
******************************** */

smsTemplates.pendingEnglishInterview = `Abhi tak aapne NavGurukul ke test ke pichle saare rounds clear kar liye hain. Congratulations :D

Aap next round tak pahunch gaye ho.
 
Next steps batane ke liye aapko jaldi hi koi call karega.
 
Tab tak aapko agar NavGurukul ke baarein mein aur janna hai toh youtube par yeh video - http://bit.ly/navgurukul-intro dekhein

Congrats again :D`;

smsTemplates.englishInterviewFail = `NavGurukul ka test India mein hazaaron students dete hain. Hum dil se koshish karte hain ki hum saare students ko software engineering padha sakein aur achi jobs dilva sakin.

Lekin kuch basic concepts zaroori hote hain iske liye jo hum apne test mein dekhte hain jo aapne kuch din pehle dia tha.

Pichle test mein humne aapki english test out kari thi. Thori se english ki knowledge zaroori hoti hai. Humein lagta hai aapko apni english pe aur kaam karne ki abhi aur zaroorat hai.

Agar aap agli baar NavGurukul ka test dena chahte ho toh apni English ki knowledge pe zyada kaam karne ki koshish karein.

Lekin yaad rakhiye ke yeh sirf ek test hai. Is mein acha ya bura karne se yeh decide nahi hota ki aap zindagi mein kaisa karoge. All the best :)`;

smsTemplates.englishInterviewWaitlisted = `NavGurukul ka test India mein hazaaron students dete hain. Hum dil se koshish karte hain ki hum saare students ko software engineering padha sakein aur achi jobs dilva sakin.

Lekin kabhi kabhi yeh faisla lena ki hum kisko bulayein bahot mushkil hota hai.

Isliye abhi humne aapka naam waitlist pe rakh dia hai. Agar aapse pehle waale kuch students mein se koi mana karta hain toh hum aapko zaroor update karenge.

Tab tak aapko agar NavGurukul ke baarein mein aur janna hai toh youtube par yeh video - http://bit.ly/navgurukul-intro dekhein`;

/** *********************************
****** culture fit interviews ******
*********************************** */

smsTemplates.pendingCultureFitInterview = `Abhi tak aapne NavGurukul aapne NavGurukul ke saare tests mein bahot hi acha kia hai. Aap next round tak pahunch gaye ho.

Congrats :D

Bas humein aapke saath ab ek final call karni hai aapke baare mein kuch aur cheezein samajhne ke liye. Humare kisi team member se aapko jald hi yeh call jayega.`;

smsTemplates.cultureFitInterviewWaitlisted = `NavGurukul ka test India mein hazaaron students dete hain. Hum dil se koshish karte hain ki hum saare students ko software engineering padha sakein aur achi jobs dilva sakin.

Lekin kabhi kabhi yeh faisla lena ki hum kisko bulayein bahot mushkil hota hai.

Isliye abhi humne aapka naam waitlist pe rakh dia hai. Agar aapse pehle waale kuch students mein se koi mana karta hain toh hum aapko zaroor update karenge.

Tab tak aapko agar NavGurukul ke baarein mein aur janna hai toh youtube par yeh video - http://bit.ly/navgurukul-intro dekhein`;

smsTemplates.cultureFitInterviewFail = `NavGurukul ka test India mein hazaaron students dete hain. Hum dil se koshish karte hain ki hum saare students ko software engineering padha sakein aur achi jobs dilva sakin.

Sadly iss baar hum aapko NavGurukul mein nahi le sakte.

Lekin yaad rakhiye ke yeh sirf ek test hai. Is mein acha ya bura karne se yeh decide nahi hota ki aap zindagi mein kaisa karoge. All the best :)`;

/** *********************************
******** parent conversations ******
*********************************** */

smsTemplates.pendingParentConversation = `NavGurukul mein aap abhi tak bahot saare interviews de chuke ho. Congratulations :D Aapka NavGurukul mein selection ho gaya hai. 

You have been selected to join NavGuukul. Jaldi hi humari team aapko call karke joining process ke baare mein sab kuch bata degi.

Hope to see you soon!!!!`;

smsTemplates.parentConversationFail = `NavGurukul mein hazaaron bache test dete hain aur sirf 60 boys aur 60 girls select hote hain. Aap select toh hue the lekin shayd kisi vajah se aapki family nahi maani NavGurukul join karne ke liye.

Hum toh chahte hain ki aap NavGurukul join kar sakein aur apni side se sab karna chayenge aapko yaha laane ke liye.

Agar aapko lagta hai humein firse aapki family se baat karke unko convince karna chaiye toh zaroor batana. Aap humari team mein se Rishabh ko call kar sakte hai. Unka number hai 8130378953. Agar phone nahi uthaya toh WhatsApp kar dein.

All the best!! Hope to see you at NavGurukul.`;

/** ****************************
******** travel planning ******
****************************** */

smsTemplates.pendingTravelPlanning = `Aapka NavGurukul mein selection ho gaya hai. Ek aur baar Congratulations :D Hum jaldi hi aapse campus mein milna chahte hain.

Jaldi se humein call kar ke apne final travel plans humein bata de. 

Humein jaldi hi apne travel plans bata dena. Nahi toh hum iss seat ko aur students jo waitlist mein unko dena chayenge.`;

smsTemplates.finalisedTravelPlans = `Abhi tak aapki kisi se baat ho gayi hai NavGurukul mein. Aap shayad apne joining ki date bhi bata chuke ho unko.

Please apni scheduled joining date tak NavGurukul join kar lein. Agar aap bahot late karte ho toh humein yeh seat waitlist mein se kisi student ko deni padegi.`;

/** *********************************
******** became disinterested ******
*********************************** */

smsTemplates.becameDisIntersested = `Kuch time pehle aapko NavGurukul se call aaya hoga. Unko aapne communicate kiya hai ki ab aap NavGurukul mein interested nahi hai.

Isliye hum aapko iss process se disqualify kar rahe hain. Iss tareeke se hum dusre students ko mauka de sakte hain.

Agar aapko abhi bhi lagta hai ki aap ismein interested hain toh please Rishabh ko directly call kar ke batyein. Aap Rishabh ko 8130378953 pe call kar sakte hain. Agar woh phone nahi uthate toh unko whatsapp kariye.`;

/** *******************************************
******** random stages for internal use ******
********************************************* */

smsTemplates.disqualifiedUnreachable = `NavGurukul mein hum bahot time se aapko call karne ki koshish kar rahe hain aapse admission ke next steps discuss karne ke liye.

Lekin sadly hum aapse baat nahi kar paa rahe hain. Ab hum aapko iss process se disqualify kar rahe hain aur ab aapko call nahi karenge.

Iss tareeke se hum dusre students ko mauka de sakte hain. Agar aapko abhi bhi lagta hai ki aap ismein interested hain toh please Rishabh ko directly call kar ke batyein. Aap Rishabh ko 8130378953 pe call kar sakte hain.

Agar woh phone nahi uthate toh unko whatsapp kariye.`;

/** *********************************
******** New user creation welcome message. ******
*********************************** */
smsTemplates.newUserTeam = 'Welcome to the Navgurukul as a Team member.';
smsTemplates.newUserStudent = 'Navgurukul ko join karne ke liye dhanyavad.';
smsTemplates.newUserPartner = 'Navgurukul main aapka swagat hai, navgurukul ko join karne ke liye hum aapka tah dil se shukriya karte hai';

smsTemplates.navgurukulAdvertisement = `आपने कुछ समय पहले नवगुरुकुल के फ्री सॉफ्टवेयर इंजीनियरिंग कोर्स में अप्लाई किया था | किसी कारन वश यदि आप एडमिशन टेस्ट नहीं क्लियर कर पाए या सिलेक्शन के बाद भी कोर्स ज्वाइन नहीं कर पाए तोह आपके पास एक और मौका है अप्लाई करने का |

Navgurukul.org एक NGO है जो की आर्थिक रूप से कमज़ोर परिवार के लड़के-लड़कियों को एक साल का फ्री स्किलिंग कोर्स करवाते है | इस कोर्स में सॉफ्टवेयर इंजीनियरिंग, इंग्लिश और पर्सनालिटी डेवलपमेंट की ट्रेनिंग दी जाती है | लड़कियों का कैंपस बैंगलोर में है, लड़को का कैंपस धर्मशाला (हिमाचल प्रदेश) में है |

यह संस्था आपके रहने खाने और पढाई का खर्चा उठाएगी | कोर्स ख़तम होने पर Rs. २०,००० - ४०,००० की जॉब भी लगवायेगी जाएगी | आप चाहे 10th पास हो या कॉलेज ग्रेजुएट या कॉलेज ड्राप आउट - यदि आप १६ वर्ष के ऊपर आयु के है तोह आप अप्लाई कर सकते है | आज के टेक्नोलॉजी वाले समय में यह कोर्स

काफी सारे आधुनिक रोज़गार के लिए काफी फायदेमंद है |अप्लाई करने के लिए और अधिक जानकारी के लिए कॉल करे - 011-4084-6385 | आज ही अप्लाई करे | इस कोर्स में दाखिला लेने वाले टेस्ट की तैयारी इस स्टडी गाइड से कर सकते है https://bit.ly/2P5nTXL

You had applied to Navgurukul's free software engineering course some time ago. If for some reason, you couldn't clear the admission test or couldn't join the program, you can apply again!!  Navgurukul.org is a social

enterprise which offers skilling in software engineering, English and personality development. It is a residential course in bangalore - your accommodation, food, and expenses will be taken care by the organisation.

At the end of the course, you would get a job in a reputed company with a starting salary of Rs. 20,000 to Rs. 40,000. Anyone who is above 16 years old can apply. You can be a 10th drop out or a B.A pass person - either

way you can benefit from this program. APPLY TODAY. To apply and to get more information, call 011-4084-6385. To prepare for the test, do these practice questions https://bit.ly/2P5nTXL`;

smsTemplates.deadlineMessage = `Hello, {{=it.user.toAssign}} aap ko {{=it.user.whoAssign}} ne'{{=it.student.name}}' ka {{=it.student.stage}} ka interview assign kiya

hai apke pas sirf 6 hours bache hai kripaya aap ese jald se jald pura kar ke {{=it.user.whoAssign}} ko update kar do

Thank You!`;

smsTemplates.deadlineEndMessage = `Hello, {{=it.user.toAssign}} aap ko {{=it.user.whoAssign}} ne '{{=it.student.name}}' ka {{=it.student.stage}} ka interview assign kiya

tha aur uski deadline khatm ho gae hai kripaya aap ese jald se jald pura kar ke {{=it.user.whoAssign}} ko update kar do

Thank You!`;

smsTemplates.assignWork = `Hello, {{=it.user.toAssign}} aap ko {{=it.user.whoAssign}} ne '{{=it.student.name}}' ka {{=it.student.stage}} ka interview assign kiya

hai kripaya aap ese jald se jald pura kar ke {{=it.user.whoAssign}} ko update kar do

Thank You!`;


module.exports = {
  // should contain the stages from the Array studentStages in constant.js
  requestCallback: dot.template(smsTemplates.rqcSMS),
  enrolmentKeyGenerated: dot.template(smsTemplates.genEnrolKeySMS),
  completedTest: dot.template(smsTemplates.completedTest),
  testFailed: dot.template(smsTemplates.testFailed),
  testPassed: dot.template(smsTemplates.testPassed),
  pendingAlgebraInterview: dot.template(smsTemplates.pendingAlgebraInterview),
  pendingAlgebraReInterview: dot.template(smsTemplates.pendingAlgebraReInterview),
  algebraInterviewFail: dot.template(smsTemplates.algebraInterviewFail),
  algebraInterviewWaitlisted: dot.template(smsTemplates.algebraInterviewWaitlisted),
  pendingEnglishInterview: dot.template(smsTemplates.pendingEnglishInterview),
  englishInterviewFail: dot.template(smsTemplates.englishInterviewFail),
  englishInterviewWaitlisted: dot.template(smsTemplates.englishInterviewWaitlisted),
  pendingCultureFitInterview: dot.template(smsTemplates.pendingCultureFitInterview),
  cultureFitInterviewWaitlisted: dot.template(smsTemplates.cultureFitInterviewWaitlisted),
  cultureFitInterviewFail: dot.template(smsTemplates.cultureFitInterviewFail),
  pendingParentConversation: dot.template(smsTemplates.pendingParentConversation),
  parentConversationFail: dot.template(smsTemplates.parentConversationFail),
  pendingTravelPlanning: dot.template(smsTemplates.pendingTravelPlanning),
  finalisedTravelPlans: dot.template(smsTemplates.finalisedTravelPlans),
  becameDisIntersested: dot.template(smsTemplates.becameDisIntersested),
  disqualifiedUnreachable: dot.template(smsTemplates.disqualifiedUnreachable),
  newUserTeam: dot.template(smsTemplates.newUserTeam),
  newUserStudent: dot.template(smsTemplates.newUserStudent),
  newUserPartner: dot.template(smsTemplates.newUserPartner),
  navgurukulAdvertisement: dot.template(smsTemplates.navgurukulAdvertisement),
  deadlineMessage: dot.template(smsTemplates.deadlineMessage),
  deadlineEndMessage: dot.template(smsTemplates.deadlineEndMessage),
  assignWork: dot.template(smsTemplates.assignWork),
};
