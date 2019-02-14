// var enrolment_key = window.location.href.split('k/').slice(-1);
var enrolment_key = "79LDFJ";
var DEBUG = true;
var slide_up_time = 600;
var slide_down_time = slide_down_time;
var questions = [];
var answers = {};
var dirty_answers = [];
var current_question = 0;
var base_url="http://35ec7046.ngrok.io";
var qDisplayed=false;

function appending(error) {
    $('#errors').html('');
    $('#errors').html(error);
}

function getQuestion(question) {
    if (question["commonText"]) {
        return question["hiText"]+"<br>"+question["commonText"];
    }
    else {
        return question["hiText"];
    }
}

function dQuestions() {
    qDisplayed = true;

    for (i=0; i<questions.length; i++) {
        dirty_answers.push(-1);
    }
    $('#btns_next_submit').show("slow");
    displayQuestion(0);
}

// For getting lat and long
var positions;
if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(positions){
        positions = positions.coords;
    });
}
else{
    appending('Geolocation not supported!');
}

function landing_page_submit() {
    $("#landing_page").slideUp(slide_up_time);
    $("#personal_details").slideDown(slide_down_time);
    setupDatePicker();
};

function setupDatePicker() {
    var monthdict ={
        'Jan':"01",'Feb':"02",'Mar':'03','April':"04","May":"05",
        'Jun':"06",'Jul':"07","Aug":"08",'Sep':"09",'Oct':'10',
        'Nov':"11",'Dec':'12', 
    }

    // To get the year
    var today = new Date();
    var yyyy = today.getFullYear()-10;
    minyyyy = yyyy-30;
        
    var datefield = $('#date');
    for (var i = 1 ; i <= 31; i++) {
        datefield.append("<option value="+i+">"+i+"</option>");
    }
    
    var monthfield = $('#month');
    for (var key in monthdict) {
        monthfield.append("<option value="+monthdict[key]+">"+key+"</option>");
    }
    var yearfield = $('#year');
    
    for (var i = minyyyy ; i <= yyyy; i++) {
        yearfield.append("<option value="+i+">"+i+"</option>");
    }    
}

function personal_details_submit() {
    var name = $('#name').val();
    var date = $('#date').val();
    var month = $('#month').val();
    var year = $('#year').val();
    var mobile = $('#mobile').val();
    var gender = $('#gender').val();

    if (DEBUG) {
        name = "abhishek";
        date = "28";
        month = "02";
        year = "1992";
        mobile = "1010101010";
        gender = "male";
        positions = {
            "latitude": 22,
            "longitude": 77
        }
    }

    // network_speed.value  = navigator.connection.downlink;

    if(!mobile){
        appending('Kripaya mobile number dijye!');
        return false;
    }
    if(mobile.length<10 || mobile.length>10){
        appending('10 digit ka mobile number daliye!');
        return false;
    }
    
    if(!name){
        appending('Kripaya apna naam batayie!');
        return false;
    } else if (name.length < 4) {
        appending('Aapka naam at least 4 characters se lamba hona chahiye!');
        return false;
    }
    if( /^[a-zA-Z]$/i.test(name)){
        appending('Naam wale section me (1,.,!,#,@,") ka istamal na kare!');
        return false;
    }
    // to check that date field isn't empty
    if(date == ''){
        appending('Kripaya Apne Janam Ka Din Chuniye!');
        return false;
    }
    else if(month == ''){
        appending('Kripaya Apne Janam Ka Mahina Chuniye!');
        return false;
    }
    else if(year == ''){
        appending('Kripaya Apne Janam Ka Saal Chuniye!');
        return false;
    }
    else if(gender == 'NONE'){
        appending('Apna gender select kijye!');
        return false;
    }

    var dob = year +'-'+ month +'-'+date;

    // dob.style.display = 'none';
    // coords.style.display = 'none';
    // network_speed.style.display = "none";
    // user_agent.style.display = "none";
    // form.appendChild(coords);
    // form.appendChild(dob);
    // form.appendChild(network_speed);
    // form.appendChild(user_agent);

    var obj = {
        "name": name,
        "whatsapp": mobile,
        "gender": gender,
        "dob": dob,
        // "gps" : {
        //     "lat": positions.latitude,
        //     "lon": positions.longitude
        // }
    }

    $.post(base_url+"/on_assessment/details/"+enrolment_key,
        obj,
        (data, resp) => {
            $("#personal_details").slideUp(slide_up_time);
            $("#time_aware").slideDown(slide_down_time);    

            console.log(resp);
            $.post(base_url+"/on_assessment/questions/"+enrolment_key,
                {},
                (data, resp) => {
                    questions = data["data"];
                    $("#page2").slideUp(slide_up_time);
                    $("#time_aware").slideDown(slide_down_time);                    
                    if (!qDisplayed) {
                        dQuestions();
                    }
                }
            );    
        }
    );
}

function time_aware_submit() {
    // show question_answer_page page
    $("#time_aware").slideUp(slide_up_time);
    $("#question_answer_page").slideDown(slide_down_time);    

    var data;
    var last_recorded_time   = new Date().getTime();
    var total_time = DEBUG ? 1000 : 3600;
    var time_remaining = total_time;

    do_it = setInterval(function(){
        new_time   = new Date().getTime()
        time_spent = (new_time - last_recorded_time)/1000;
        last_recorded_time = new_time;
        time_remaining -= time_spent;

        time_to_show = time_remaining;

        minutes = Math.floor(time_to_show/60);
        seconds = Math.round(time_to_show%60);

        $('.progress-bar').css({"width":time_remaining*100/(total_time)+"%"})

        if(time_remaining<=1) {
            $("#time_to_show").html("<h4>Time Over Submitting Your Test Now.</h4>");
            submitTest();
            $('.progress').hide();
            clearInterval(do_it);
        } else if (time_remaining <= 15) {
            msg = "<h4>Time Over Submitting Your Test Now "+ ".".repeat(Math.floor(time_remaining)%4+1) + " </h4>";
            $("#time_to_show").html(msg);
        } else {
            $("#time_to_show").html("Time Remaining: "+minutes+" minutes "+seconds+" seconds.");
        }
    }, 1000); 

    if (DEBUG) {
        questions = [{"id":459,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/9eea686b-892a-441e-ad73-162e359e80fe-choice2.png\" alt=\"\"></p>\n","enText":null,"hiText":"<p>Neeche di gayi picture mein dekh ke batao ki pure mein se kitna area shaded hai?</p>\n","difficulty":2,"topic":"Basic Math","type":1,"createdAt":"2019-02-12 17:18:38.099","options":[{"id":685,"text":"<p>25%</p>","questionId":459,"correct":false,"createdAt":"2019-02-12 17:18:38.275"},{"id":686,"text":"<p>35%</p>","questionId":459,"correct":true,"createdAt":"2019-02-12 17:18:38.275"},{"id":687,"text":"<p>30%</p>","questionId":459,"correct":false,"createdAt":"2019-02-12 17:18:38.275"},{"id":688,"text":"<p>40%</p>","questionId":459,"correct":false,"createdAt":"2019-02-12 17:18:38.275"}]},{"id":427,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/a2d20146-7aaf-4daf-9060-f7061abcaf54-choice2.png\" alt=\"\"></p>\n","enText":null,"hiText":"<p>Question mark ki jagah par sahi figure choose kijiye.</p>\n","difficulty":1,"topic":"Abstract Reasoning","type":1,"createdAt":"2019-02-12 17:18:37.915","options":[{"id":589,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/b2380b02-7198-4c0d-b720-abfeee94904c-option3.png\" alt=\"\"></p>","questionId":427,"correct":true,"createdAt":"2019-02-12 17:18:37.992"},{"id":590,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/ee083c73-ba0b-471e-ab8d-028bbb4856c9-option2.png\" alt=\"\"></p>","questionId":427,"correct":false,"createdAt":"2019-02-12 17:18:37.992"},{"id":591,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/210b45e0-af8a-4789-85c4-6734d1836b8d-option1.png\" alt=\"\"></p>","questionId":427,"correct":false,"createdAt":"2019-02-12 17:18:37.992"},{"id":592,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/edae0e4d-499d-4f4a-a454-2e10957a7f32-option4.png\" alt=\"\"></p>","questionId":427,"correct":false,"createdAt":"2019-02-12 17:18:37.992"}]},{"id":399,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/3822909c-6bf6-4e67-963a-cb8da0115a74-choice1.png\" alt=\"\"></p>\n","enText":"<p>PENDING</p>\n","hiText":"<p>Niche diye hue image kitne blocks se bana hua hai?</p>\n","difficulty":2,"topic":"Abstract Reasoning","type":1,"createdAt":"2019-02-12 16:48:44.000","options":[{"id":506,"text":"<p>B</p>","questionId":399,"correct":false,"createdAt":"2019-02-12 16:48:44.142"},{"id":507,"text":"<p>A</p>","questionId":399,"correct":false,"createdAt":"2019-02-12 16:48:44.142"},{"id":508,"text":"<p>E</p>","questionId":399,"correct":true,"createdAt":"2019-02-12 16:48:44.142"},{"id":509,"text":"<p>C</p>","questionId":399,"correct":false,"createdAt":"2019-02-12 16:48:44.142"},{"id":551,"text":"<p>D</p>","questionId":399,"correct":false,"createdAt":"2019-02-12 16:48:44.284"}]},{"id":444,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/1c076e2c-c223-4759-9410-7f6568d20b4c-choice1.png\" alt=\"\"></p>\n","enText":null,"hiText":"<p>Niche diye hue images mein agla image kaun sa aayega</p>\n","difficulty":3,"topic":"Non Verbal Reasoning","type":1,"createdAt":"2019-02-12 17:18:38.028","options":[{"id":652,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/94b62d02-0b3f-484c-aa85-014b752bb8f3-option1.png\" alt=\"\"></p>","questionId":444,"correct":false,"createdAt":"2019-02-12 17:18:38.198"},{"id":653,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/28e0a584-8536-4d11-bf22-f00947272cd7-option2.png\" alt=\"\"></p>","questionId":444,"correct":false,"createdAt":"2019-02-12 17:18:38.198"},{"id":654,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/1735dc3f-dcd5-4ecb-9c6f-02e684b6c588-option3.png\" alt=\"\"></p>","questionId":444,"correct":true,"createdAt":"2019-02-12 17:18:38.198"},{"id":655,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/75bb32ac-500a-44c5-97df-ab4f8616862e-option4.png\" alt=\"\"></p>","questionId":444,"correct":false,"createdAt":"2019-02-12 17:18:38.198"}]},{"id":461,"commonText":null,"enText":null,"hiText":"<p>Nimbu paani ke ek glass mein 12 gram cheeni dalti hai aur 3 ml nimbu. Neeche diye gaye options mein se yeh bataye ki 8 glass Nimbu Paani banane ke liye aapko kitni cheeni aur nimbu chahiye?</p>\n","difficulty":3,"topic":"Basic Math","type":1,"createdAt":"2019-02-12 17:18:38.099","options":[{"id":693,"text":"<p>98 gram cheeni, 21 ml nimbu</p>","questionId":461,"correct":false,"createdAt":"2019-02-12 17:18:38.275"},{"id":694,"text":"<p>96 gram cheeni, 24 ml nimbu</p>","questionId":461,"correct":true,"createdAt":"2019-02-12 17:18:38.275"},{"id":695,"text":"<p>84 gram cheeni, 24 ml nimbu</p>","questionId":461,"correct":false,"createdAt":"2019-02-12 17:18:38.275"},{"id":696,"text":"<p>92 gram cheeni, 25 ml nimbu</p>","questionId":461,"correct":false,"createdAt":"2019-02-12 17:18:38.275"}]},{"id":422,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/91960e59-2a67-434a-b3f5-aaf4ba742d6e-choice1.png\" alt=\"\"></p>\n","enText":null,"hiText":"<p>Shaded area poore area ka kitna percent hai?</p>\n","difficulty":2,"topic":"Basic Math","type":1,"createdAt":"2019-02-12 16:48:44.142","options":[{"id":571,"text":"<p>25%</p>","questionId":422,"correct":false,"createdAt":"2019-02-12 16:48:44.365"},{"id":572,"text":"<p>35%</p>","questionId":422,"correct":false,"createdAt":"2019-02-12 16:48:44.365"},{"id":573,"text":"<p>30%</p>","questionId":422,"correct":true,"createdAt":"2019-02-12 16:48:44.365"},{"id":574,"text":"<p>40%</p>","questionId":422,"correct":false,"createdAt":"2019-02-12 16:48:44.365"}]},{"id":416,"commonText":"<p>x = y - 6\ny = 10\nx = ?</p>\n","enText":null,"hiText":"<p>Neeche diye hue equations mein x ke liye solve karein:</p>\n","difficulty":2,"topic":"Basic Math","type":2,"createdAt":"2019-02-12 16:48:44.087","options":[{"id":550,"text":"4","questionId":416,"correct":true,"createdAt":"2019-02-12 16:48:44.189"}]},{"id":450,"commonText":null,"enText":"<p>PENDING</p>\n","hiText":"<p>Aapke room ka temperature -17 degree celsius hai. Aapne apne room mein room heater on kiya. Ab aapke kamre ka temperature every 5 minutes mein 3 degree celsius badh raha hai. 30 mins baad aapke room ka temperature kitna hoga?</p>\n","difficulty":3,"topic":"Basic Math","type":2,"createdAt":"2019-02-12 17:18:38.061","options":[{"id":660,"text":"1","questionId":450,"correct":true,"createdAt":"2019-02-12 17:18:38.226"}]},{"id":426,"commonText":"<p>8 + (−25) + 16 − (−25) −16</p>\n","enText":"<p>Solve the equation given above.</p>\n","hiText":"<p>Upar diye gaye equation ko solve kare.</p>\n","difficulty":1,"topic":"Basic Math","type":2,"createdAt":"2019-02-12 17:18:37.897","options":[{"id":587,"text":"8","questionId":426,"correct":true,"createdAt":"2019-02-12 17:18:37.992"}]},{"id":442,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/3ace8ee7-4c8f-4ed4-99c7-060221b657c0-choice2.png\" alt=\"\"></p>\n","enText":"<p>Choose the Mirror image of X from the images given below.</p>\n","hiText":"<p>Niche diye hue images mein se X ki mirror image ko chuniye</p>\n","difficulty":1,"topic":"Non Verbal Reasoning","type":1,"createdAt":"2019-02-12 17:18:38.000","options":[{"id":642,"text":"<p>3</p>","questionId":442,"correct":false,"createdAt":"2019-02-12 17:18:38.114"},{"id":643,"text":"<p>1</p>","questionId":442,"correct":false,"createdAt":"2019-02-12 17:18:38.114"},{"id":644,"text":"<p>2</p>","questionId":442,"correct":true,"createdAt":"2019-02-12 17:18:38.114"},{"id":645,"text":"<p>4</p>","questionId":442,"correct":false,"createdAt":"2019-02-12 17:18:38.114"}]},{"id":449,"commonText":null,"enText":"<p>PENDING</p>\n","hiText":"<p>Ek machhli paani mein 300 metres neeche thi. Aapko woh macchli pakadni hai toh aapne paani ke upar chara dala. Ab woh machhli har 5 minute mein 25 metre upar aa rahi hai. 20 minute baad woh machhli paani mein kitne metre neeche hogi?</p>\n","difficulty":3,"topic":"Basic Math","type":2,"createdAt":"2019-02-12 17:18:38.061","options":[{"id":661,"text":"200","questionId":449,"correct":true,"createdAt":"2019-02-12 17:18:38.226"}]},{"id":407,"commonText":"<p><strong>1, 8, 27, 64, 125, ___</strong></p>\n","enText":null,"hiText":"<p>Inn numbers ko dekhiye aur agla number guess kijiye. Apna answer ko answers wale page pe likhiye.</p>\n","difficulty":2,"topic":"Non Verbal Reasoning","type":2,"createdAt":"2019-02-12 16:48:44.041","options":[{"id":535,"text":"216","questionId":407,"correct":true,"createdAt":"2019-02-12 16:48:44.158"}]},{"id":396,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/a5537383-cdf9-4329-97dc-df1ad645103c-choice2.png\" alt=\"\"></p>\n","enText":"<p>PENDING</p>\n","hiText":"<p>Question mark ki jagah par sahi figure choose kijiye.</p>\n","difficulty":3,"topic":"Abstract Reasoning","type":1,"createdAt":"2019-02-12 16:48:44.000","options":[{"id":494,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/5c6d3603-c12b-447b-8aeb-0acd833caba0-option1.png\" alt=\"\"></p>","questionId":396,"correct":false,"createdAt":"2019-02-12 16:48:44.125"},{"id":495,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/39fbaf7d-3e5f-4495-b3bf-fb45ba3ce1d9-option2.png\" alt=\"\"></p>","questionId":396,"correct":true,"createdAt":"2019-02-12 16:48:44.125"},{"id":496,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/dcbd0004-6864-4496-9aa6-4cb61e15047b-option3.png\" alt=\"\"></p>","questionId":396,"correct":false,"createdAt":"2019-02-12 16:48:44.125"},{"id":497,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/045b899e-34cc-459b-888b-aa69573663b1-option4.png\" alt=\"\"></p>","questionId":396,"correct":false,"createdAt":"2019-02-12 16:48:44.125"}]},{"id":414,"commonText":null,"enText":null,"hiText":"<p>Maan lein ki x = a/b hai. Agar a =6 aur b=2 toh x ki value kya hai?</p>\n","difficulty":1,"topic":"Basic Math","type":2,"createdAt":"2019-02-12 16:48:44.087","options":[{"id":548,"text":"3","questionId":414,"correct":true,"createdAt":"2019-02-12 16:48:44.189"}]},{"id":400,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/e3c4fc4d-eef5-4f3e-8258-3f053dc05ae4-choice1.png\" alt=\"\"></p>\n","enText":null,"hiText":"<p>Fold karne ke baad, ye 2D image kis box ki tarah banega?</p>\n","difficulty":3,"topic":"Abstract Reasoning","type":1,"createdAt":"2019-02-12 16:48:44.014","options":[{"id":522,"text":"<p>A</p>","questionId":400,"correct":false,"createdAt":"2019-02-12 16:48:44.142"},{"id":523,"text":"<p>E</p>","questionId":400,"correct":false,"createdAt":"2019-02-12 16:48:44.142"},{"id":524,"text":"<p>B</p>","questionId":400,"correct":true,"createdAt":"2019-02-12 16:48:44.142"},{"id":525,"text":"<p>C</p>","questionId":400,"correct":false,"createdAt":"2019-02-12 16:48:44.142"},{"id":566,"text":"<p>D</p>","questionId":400,"correct":false,"createdAt":"2019-02-12 16:48:44.346"}]},{"id":393,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/5cbe97a0-88f8-4a4d-a114-cb47e1ef8cfb-choice2.png\" alt=\"\"></p>\n","enText":null,"hiText":"<p>Question mark ki jagah par sahi figure choose kijiye.</p>\n","difficulty":1,"topic":"Abstract Reasoning","type":1,"createdAt":"2019-02-12 16:48:43.989","options":[{"id":482,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/36de0977-39db-41bd-8e68-8b82122cac49-option1.png\" alt=\"\"></p>","questionId":393,"correct":false,"createdAt":"2019-02-12 16:48:44.103"},{"id":483,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/09cd66ed-2e64-41e0-ac3a-685bbf5879f0-option2.png\" alt=\"\"></p>","questionId":393,"correct":false,"createdAt":"2019-02-12 16:48:44.103"},{"id":484,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/b50b5aa0-1f42-49ae-9440-f1d943f99bf4-option3.png\" alt=\"\"></p>","questionId":393,"correct":true,"createdAt":"2019-02-12 16:48:44.103"},{"id":485,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/93513b09-6109-4745-a8e4-578af119de09-option4.png\" alt=\"\"></p>","questionId":393,"correct":false,"createdAt":"2019-02-12 16:48:44.103"}]},{"id":395,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/9a03a8e1-c720-47fd-9bd3-27a4152f1d39-choice2.png\" alt=\"\"></p>\n","enText":"<p>PENDING</p>\n","hiText":"<p>Question mark ki jagah par sahi figure choose kijiye.</p>\n","difficulty":2,"topic":"Abstract Reasoning","type":1,"createdAt":"2019-02-12 16:48:43.989","options":[{"id":490,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/b483576d-3792-4657-94da-0ab844e3d5ce-option1.png\" alt=\"\"></p>","questionId":395,"correct":false,"createdAt":"2019-02-12 16:48:44.125"},{"id":491,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/a172f410-ab50-4077-9a4a-8a1357a99d11-option2.png\" alt=\"\"></p>","questionId":395,"correct":true,"createdAt":"2019-02-12 16:48:44.125"},{"id":492,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/6fef7ebe-44da-4c24-86cf-efde0cf1bccd-option3.png\" alt=\"\"></p>","questionId":395,"correct":false,"createdAt":"2019-02-12 16:48:44.125"},{"id":493,"text":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/276b3da1-0cd6-4217-bcbe-0f1bf1bc2546-option4.png\" alt=\"\"></p>","questionId":395,"correct":false,"createdAt":"2019-02-12 16:48:44.125"}]},{"id":417,"commonText":"<p><img src=\"https://s3.ap-south-1.amazonaws.com/chanakya-dev/questionImage/0ed7edf3-43c4-46f4-9b95-8461bcb55e4c-choice1.png\" alt=\"\"></p>\n","enText":null,"hiText":"<p>Shaded area poore area ka kitna percent hai?</p>\n","difficulty":1,"topic":"Basic Math","type":1,"createdAt":"2019-02-12 16:48:44.125","options":[{"id":552,"text":"<p>50%</p>","questionId":417,"correct":false,"createdAt":"2019-02-12 16:48:44.286"},{"id":553,"text":"<p>70%</p>","questionId":417,"correct":true,"createdAt":"2019-02-12 16:48:44.286"},{"id":554,"text":"<p>60%</p>","questionId":417,"correct":false,"createdAt":"2019-02-12 16:48:44.286"},{"id":555,"text":"<p>80%</p>","questionId":417,"correct":false,"createdAt":"2019-02-12 16:48:44.286"}]}];

        dQuestions();
    }

    // $.post("/test/start_test/"+enrolment_key,
    //     {},
    //     function(data, resp) {
    //         data = data;
    //     }
    // );
}

function nextQuestion() {
    updateAnswer(current_question);
    current_question += 1;
    displayQuestion(current_question);
}

function previousQuestion() {
    updateAnswer(current_question);
    current_question -= 1;
    displayQuestion(current_question);
}

function updateAnswer(index) {
    if (questions[index]["type"] == 1) {
        answers[questions[index]["id"]] = $('#qmcq .option button.active').attr('data-id');
    } else {
        answers[questions[index]["id"]] = $('#qinteger_answer input').val();
    }
    console.log(answers);
    return true;
}

function showAnswer(index) {
    if (dirty_answers[index] == -1) {
        dirty_answers[index] = 0;
        $('#qmcq .option button.active').removeClass('active');
        $('#qinteger_answer input').val("");
    }
    else if (questions[index]["type"] == 1) {
        $('#qmcq .option button').each(function(i, obj) {
            if ($(this).attr('data-id')==answers[questions[index]["id"]]) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });
    } else {
        $('#qinteger_answer input').val(answers[questions[index]["id"]]);
    }
    return true;
}


function displayQuestion(index) {
    if (index == 1) {
        $('#prev_button').show("slow");
    } else if (index == 0) {
        $('#prev_button').hide("slow");
    }

    if (index == questions.length - 1) {
        //i am at last question
        $('#next_btn').hide("slow");
        $('#submit_btn').show("slow");
    } else {
        $('#next_btn').show("slow");
        $('#submit_btn').hide("slow");
    }
    
    if (index >= questions.length) {
        $('#btn_next_submit').hide('slow');
        return "HO GAYA :D";
    } 
    else {
        //display question with index index
        var question = questions[index];
        if (question["type"] == 1) {
            // $('#qmcq').slideUp(slide_up_time);
            $('#qinteger_answer').slideUp(slide_up_time);
            $('#qmcq').slideDown(slide_down_time);
            $('#qmcq .qtext').html(getQuestion(question));
            var options = question["options"];
            var options_html = "";

            for(var i=0; i<options.length; i++) {
                //button 
                // options[i]["id"]
                options_html += `<div class="option col-xs-12 col-sm-12 col-md-6 mt-1 text-center mt-2"> \
                <button type="button" class="btn btn-outline-info" data-id="`+options[i]["id"]+`" onclick="makeActive(`+i+`)">` + options[i]["text"] +
                `</div>`;

                // <input type="radio" value="B or C" name="answer_1"  \
                // id="id_10" class="cls_1"/> \
                //     <label class="answer-label" for="id_10">`

            }

            $('#qmcq .options .row').html(options_html);
        } 
        else if (question["type"] == 2) {
            $('#qmcq').slideUp(slide_up_time);
            // $('#qinteger_answer').slideUp(slide_up_time);
            $('#qinteger_answer').slideDown(slide_down_time);
            $('#qinteger_answer .qtext').html(getQuestion(question));
        }
        else {
            console.log("YEH KAHA AA GAYE HUM, YUHI SERVER PAR TRUST KARTE KARTE!");
            //        displayQuestion(index+1);
        }
    }

    showAnswer(index);
}

function makeActive(index) {
    $('#qmcq .option button').each(function(i, obj) {
        if (i==index) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
}

function submitTest() {
    updateAnswer(current_question);

    $('#question_answer_page').slideUp(slide_up_time);
    $("#end_page").slideDown(slide_down_time);
    
    $.post(base_url+"/on_assessment/questions/"+enrolment_key+"/answers",
        answers,
        function(data, resp) {
            console.log(resp);
        }
    );
}

if (DEBUG) {
    $(document).ready(function() {
        landing_page_submit();
        personal_details_submit();
        // time_aware_submit();
    });
}