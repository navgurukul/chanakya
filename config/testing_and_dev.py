import random, string
import os

STUDENT_DIRECTORY = os.path.expanduser('~/student_files')
TEST_VERSION = "DEV and Testing Environment"
SYSTEM_ENVIRONMENT="Development"

# Database
SQLALCHEMY_DATABASE_URI = "mysql://chanakya:chanakya@localhost/chanakya"
SQLALCHEMY_TRACK_MODIFICATIONS = True

# Flask level config
SECRET_KEY = "abcdef"
#SECRET_KEY = "".join([random.choice(string.ascii_uppercase) for x in range(10)])
DEBUG = True


# Exotel Related Config
TEST_ENROLL_MSG = """
NavGurukul ki scholarship ke liye apply karne ke liye, thank you.

Iss test ko dene ke liye aap jald hi, yeh website - http://localhost:8000/?key={test_url} kholein aur test ko de. Test dene ke liye aap apne paas ek notebook aur pen tayyar rakhe, aur apne answers ko apne phone mei hi answer karein.

NavGurukul ke baarein mei aur jaanne ke liye, youtube par yeh video - http://bit.ly/navgurukul-intro dekhein.

Test ke liye best of luck :) Test ke baad hum aap ko call kar kar, aage ke steps batayenge.
"""
EXOTEL_AUTH  = {
    'username': 'navgurukul',
    'password': 'd8d7378e5eaa22ebf345a62dd391c479aeedb440'
}
EXOTEL_SMS_NUM = "01139595141"

# Zoho CRM Related Config
CRM_AUTH_TOKEN = "dff429d03714ecd774b7706e358e907b"
POTENTIAL_STUDENT_STAGE_NOTIFS = {
    "Interested & Called": None,
    "Entrance Test": None,
    "Lightbot Activity": {
        "sms": "Congrats! Aapne NavGurukul ki Scholarship paane ka first step clear kar liya hai. Hum aap ko kuch hi samay mei call karke agle steps ki jaan kaari denge. Kaafi kam log iss tarah se test mei itna accha perform kar paate hai. Aap helpline number ( 011-3959-5141) par bhi call kar sakte hai, adheek jaankaari ke liye.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is a template"
    },
    "Privilege Check": {
        "sms": "Congrats! Aapne NavGurukul ki scholarship ke test ka dusra test bhi clear kar liya hai. Yeh test bahot kam log hi clear kar pate hain. Hum aap ko call kar kar aage ke steps jaldi hi batayenge. Aap helpline number ( 011-3959-5141) par bhi call kar sakte hai, adheek jaankaari ke liye.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is a template."
    },
    "Personal Interview": None,
    "Parent Conversation": None,
    "Confirmed Joining": None,
    "Probation Period": None,
    "NG Fellow": None,
    "Failed Probation": None,
    "Graduated": None,
    "Became Disinterested": None,
    "Entrance Test Failed": {
        "sms": "NavGurukul ki scholarship ka test kaafi mushkil hai aur kaafi kam log isse clear kar paate hai. Hume yeh batate hue kaafi dukh ho raha hai, ki aapka test clear nahi hua hai. Par humein poora bharosa hai ki aap ke paas aisi aur kaafi opportuntiies aayengi, jinke saath aap apne sapnei poore kar paaoge. Good luck.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is a template."
    },
    "Lightbot Activity Failed": {
        "sms": "NavGurukul ki scholarship ka dusra test kaafi mushkil hota hai aur isse kaafi kam log hi clear kar pate hain. Humein yeh batae hue kaafi dukh hai, ki aapke test ka dusra round clear nahi hua hai. Par humein poora bharosa hai ki aap ke paas aisi aur kaafi opportuntiies aayengi, jinke saath aap apne sapnei poore kar paaoge. Good luck.",
        "exotel_obd_id": None,
        "referral_email_template": "Here is the a tempalate."
    },
    "Privilege Check Failed": None,
    "Personal Interview Failed": None,
    "Parent Conversation Failed": None,
    "Probation Failed": None,
    "Left before Completion": None,
    "Kicked Out": None
}
CRM_NEW_STUDENT_TASKS = {
    "Requested Callback": {
        "task_message": "[Requested Callback] Call back and take next steps.",
        "task_description":'''


Yaani k student ne 3 press kiya hai humari Navgurukul ki helpline par aur veh vyakti Navgurukul me kisi se baat karna chahta hai.

Make a call to the student as explained in the section above. You can greet her with something like this:

Iss vyakti ko hum call karenge aur kuch iss prakaar apne introduction denge:

Good Morning/Afternoon/Evening Sir/Ma’am. Aapne NavGurukul ki helpline mein call kiya tha. Hum ek software engineering ki scholarship dete hain gareeb bachon ko jiske baad unki achi jobs lag payein. Aapne Navgurukul ki helpline par call kiya tha humse baat karne k liye, isliye maine aapko call kiya hai, bataiye mai kis tarah aapki help kar sakti hu.

aisa karna isliye jaruri hai kyuki bahut baar logo ko Navgurukul naam yaad nahi rehta ya fir student khud phone nahi uthata aur jisne phone uthaya hota hai usse andaj ho jata hai ki kisne phone kiya hoga.

Ab saamne vale vyakti se baat karte waqt niche diye gye cases me se koi ek case hoga:

Student/Guardian had a doubt and you had an answer. There will be a couple of scenarios in such a case:
The doubt was cleared and student wants to answer the test.
- Use the steps documented in Point 3.
The doubt was cleared but student said that she will think if she wants to give the test.
- Document what you talked to her on the cal.
- Create a follow-up task with the subject “Call and figure out if they have registered for a test.” for 3 days from the current date.
- This task will remind you to call her after a few days to ask if she has registered for a test.
The student is not relevant.
- Use the steps documented in Point 4.
Student/Guardian has a doubt and you don’t know the answer to the doubt.
- Document what you talked about in the description of the call.
- Create a follow up task with Rishabh as the owner of the task and subject as “Clear the doubt of <student name> as I am not clear.”
- Mark the current task as complete.
Student wants to answer the test.
- Document what was talked about in the call.
- You don’t need to make any follow up task. Just mark the current task as completed.
- You will have to send her an SMS with the URL to give the test. To do that you will have to open the main “Potential” page in a new tab in your browser.
- On the page use the “Create Enrolment Key” button on the top right on the Potential page in Zoho CRM to send a SMS to her. A SMS will be sent at the stage of this task will be changed to “Enrolment Key Manually Generated”
- You don’t need to do anything after this.
The student is totally not relevant.
- Mark the task associated with the potential as Completed.
- Mark the stage of this potential as “Not Relevant”
- Do not create a follow up task to this.
The Caller is a Partner
- Tell them that Someone from Navgurukul Team will Call you back.
- Create a Follow Up task with high Priority for Shanu or Rishabh
Student Has given the test but have some simple Query
- Resolve the Query
- Mark Task as Done
- Change Stage of Potential to “Query Resolved”
The student was not reachable/phone switched off/didn’t pick up.
- Add initial Due Date before Changing Due Date for the First Time.
- Change the due date of Task to next day.
- Add Note that they didn’t pick up the Call

Note: Agar inn cases me se koi case nahi hai toh shanu ya rishabh ko cliq par ping karo aur potential page ka link bhi bhejo.

                '''
    },
    "Entrance Test": {
        "task_message": "[Entrance Test] Evaluate the answers and decide next steps.",
        "task_description":'''

1. Open the potential in a new tab by clicking on <Potential Name>.
2. Call them and ask if he faced any problems while answering the test. If they faced problems toh woh steps follow karo jo ki “.*Unke test ka result wala URL nahi khul raha*” mein diye hue hain.
3. Alag alag case mein kya kya karna hai, woh sab neeche bata rakha hai.
4. Har step mein call recording attach karna na bhulein.
5. Notes mein recording upload karo.

Follow the instructions given below for every case.


Uska phone off ya unreachable tha
1. Add a Note in the Task that, “phone was not reachable/switch-off”.
2. Change the due date of the task to next date.
3. Go to the next task.
4. Notes mein recording upload karo.



Kisi aur ne phone uthaya
1. Unse pucho ki kya woh aapki baat uss bache se karva sakte hain.
2. Agar woh call karne ka alag number dete hain, toh uss number pe call karo aur notes mein woh number daal do.
3. Agar baat ho jaati hai toh neeche wale steps (3 se 5) follow karein. Agar nahi hoti hai toh Task ki Due Date change karke aage badh jao.
4. Student se baat karke isse neeche waale steps follow karo.
5. Notes mein recording upload karo.


Not Relevant
1. Note mein likhiye ki yeh student relevant kyun nahi hai.
2. Iss task ko close kar do.
3. Notes mein recording upload karo.


Unke test ka result wala URL nahi khul raha
1. Unhe bolo ki test ek aur baar test dena hoga. Fir usse pucho ki <Potential Name> pe SMS bhej do.
2. Agar woh haan kehti hai, toh Potential Naye tab mein khol ke “Create Enrolment Key” wale button pe click karo aur bolo ki aapko 5 minute mein SMS aa jayega.
3. Agar woh kehte hain ki kisi aur number pe chaiye toh iss URL pe jakar bhejo - join.navgurukul.org/exotel_enroll_for_test?CallFrom=xxxxxxxxxx. Yahan xxxxxx ki jagah woh number daaal do jo student ne bataya.
4. Agar tumne URL ka use kar ke SMS bheja hai toh potential naye tab mein khol ke uska stage “Enrolment Key Manually Generated” pe change kar do.
5. Task ko close karo aur aage badho.
6. Notes mein recording upload karo.

Marks 13 se zyada hain
1. Unko congrats bolo aur batao ki aap next stage ke liye select ho gaye.
2. Bolo next stage mein android phone aur internet connection chaiye hoga.
3. Teen din baad ka koi bhi time choose kar ke unko bolo ki kya woh iss time pe kar sakte hain. Agar nahi toh time figure out karo baat kar ke.
4. Potential ka page naye tab mein khol ke, neeche scroll down kar ke +New Event ka use kar ke naya event banao. Event ka subject “Lightbot Activity of <Potential Name>" rakho. Date choose karo jo decide hui hai. Jo bhi time decide hua hai uss time ko From mein daalo aur 2 hours aage To mein.
5. Potential ka stage change karo.
6. Task mein wapas jake usko close kar do.
7. Notes mein recording upload karo.

Marks 13 se kam hain
1. Pehle Confirm karo aapki baad student se ho rahi hai.
2. Student se Pucho ki kya usse Test dete waqt koi problem toh face nahi hui.
3. Agar Student ko test dete waqt koi dikkat hui ho jisse ki veh sahi se test na de paya ho uss student k liye firse enrolment key generate karo.
4. Agar Student kehta hai usse koi dikkat nahi hui thi test dete waqt toh usse batao ki veh fail ho gya hai, aap usse kuch iss tarah bataenge:
“Mai aapko batana chahunga ki aap Navgurukul k test me paas nahi ho paaye, Navgurukul ka test dene k liye thank you, agar aapko kuch aur jaanna toh aap mujhse pooch sakte ho”.

- Bahut baar student poochta hai ki uske kitne marks aaye aur kitne chahiye pass hone k liye toh aap yeh detail uske sang share kar sakte hai.

- Agar student poochta hai ki kyaa veh dubara test de sakta hai toh aap usse bataiye ki veh dubara test nahi de sakta.

5. Potential ka stage change karke Entrance Test Failed kardo
6. Task mein wapas jake usko close kar do.
7. Notes mein recording upload karo.


Kuch aur Hua jo samajh nahi aaya
1. Notes mein likho ki aisa kya hua ki aapko samajh nahi aaya.
2. Iss task ko close kar do.
3. Follow Up task waale button se ek task banao jisme “Rishabh” ko owner mark kar do aur subject mein daalo “Take next action because we  didn’t understand the task because <Potential Name>"
4. Notes mein recording upload karo.
        '''

    }
}

POTENTIAL_OWNERS = [
    "2821772000000970116", #Khushboo    
    "2821772000001241492", #monu
]

REQUESTED_CALLBACK_TASK_OWNERS=[
    "2821772000001108001", #shivnath    
    "2821772000001145029", #ranjan    
    "2821772000001145055", #rahul 
]
ENTRANCE_TEST_TASK_OWNERS=[
    "2821772000000131011", #rishabh
]