var DEBUG = false;

if (!DEBUG) {
    var enrolment_key = window.location.href.split('k/').slice(-1);
    var base_url="/api";
} else {
    var enrolment_key = "LW8A0G";
    var base_url="http://join.navgurukul.org/api";
}

var slide_up_time = 600;
var slide_down_time = slide_down_time;
var questions = [];
var answers = {};
var dirty_answers = [];
var current_question = 0;
var qDisplayed=false;

function appending(error) {
    $('.errors').html('');
    $('.errors').html(error);
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
var positions = {"latitude": -1, "longitude": -1};
if (navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
        (positions) => {
            positions = positions.coords;
        },
        (error) => {
            //appending('Geolocation not supported!');
        }
    );
}
else{
    //appending('Geolocation not supported!');
}

function landing_page_submit() {
    mixpanel.track("Personal Details");
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
    var mdob = year+"-"+month+"-"+date+"T00:00:00";

    var obj = {
        "name": name,
        "whatsapp": mobile,
        "gender": gender,
        "dob": dob,
        "gpsLat": positions.latitude,
        "gpsLong": positions.longitude
    };
    
    mixpanel.identify(mobile);

    mixpanel.people.set({
        "$name": name,
        "$phone": mobile,
        "$gender": gender,
        "$dob" : mdob
    });

    $.post(base_url+"/on_assessment/details/"+enrolment_key,
        obj,
        (data, resp) => {
            mixpanel.track("Personal Details Submitted");

            $("#personal_details").slideUp(slide_up_time);
            $("#time_aware").slideDown(slide_down_time);
            appending('');

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
        },
        'json'
    );
}

function submitApp() {
    appending('');

    var pinCode = $('#pinCode').val();
    var qualification = $('#qualification').val();
    var state = $('#state').val();
    var city = $('#city_or_village').val();
    var currentStatus = $('#currentStatus').val();
    var schoolMedium = $('#schoolMedium').val();
    var caste = $('#caste').val();
    var religion = $('#religion').val();

    if (DEBUG) {
        pinCode = 110010;
        qualification = "lessThan10th";
        state = "AN";
        city = "Gurgaon";
        currentStatus = "job";
        schoolMedium = "en";
        caste = "scSt";
        religion = "hindu";
    }

    if(!pinCode || pinCode.length < 6 || pinCode.length > 6){
        appending('Sahi Pin Code enter kijiye!');
        return false;
    }
    
    if( !state || state == "NONE"){
        appending('Apna State Select karo!');
        return false;
    }

    if( !city ) {
        appending('Apni City ya Village ka naam enter karo!');
        return false;
    }

    if( /^[a-zA-Z]$/i.test(city)) { 
        appending('City ya Village ke naam mein (1,.,!,#,@,") ka use na kare!');
        return false;
    }

    if(!currentStatus || currentStatus=="NONE"){
        appending('Apne current status ko select karo!');
        return false;
    }

    if(!qualification || qualification == "NONE"){
        appending('Qualification select karo!');
        return false;
    }

    if(!schoolMedium || schoolMedium=="NONE"){
        appending('Apne last school ka medium select karo!');
        return false;
    }

    if(!caste || caste=="NONE"){
        appending('Apni caste select karo!');
        return false;
    }

    if(!religion || religion=="NONE"){
        appending('Apna religion select karo!');
        return false;
    }

    var obj = {
        "pinCode": pinCode,
        "qualification": qualification,
        "state": state,
        "city": city,
        "currentStatus": currentStatus,
        "schoolMedium": schoolMedium,
        "caste": caste,
        "religon": religion
    }

    mixpanel.people.set({
        "$pinCode": pinCode,
        "$qualification": qualification,
        "$state": state,
        "$city": city,
        "$currentStatus": currentStatus,
        "$schoolMedium": schoolMedium,
        "$caste": caste,
        "$religon": religion
    });

    $.post(base_url+"/on_assessment/details/"+enrolment_key,
        obj,
        (data, resp) => {
            $("#end_page").slideUp(slide_up_time);
            $("#thank_you_page").slideDown(slide_down_time);
            mixpanel.track("Thank You");
        },
        'json'
    );
}

function time_aware_submit() {
    // show question_answer_page page
    $("#time_aware").slideUp(slide_up_time);
    $("#question_answer_page").slideDown(slide_down_time);    

    mixpanel.track("Question 1");

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

    // $.post("/test/start_test/"+enrolment_key,
    //     {},
    //     function(data, resp) {
    //         data = data;
    //     }
    // );
}

function nextQuestion() {
    updateAnswer(current_question);
    mixpanel.track("Next " + current_question);
    current_question += 1;
    displayQuestion(current_question);
}

function previousQuestion() {
    updateAnswer(current_question);
    mixpanel.track("Previous " + current_question);
    current_question -= 1;
    displayQuestion(current_question);
}

function updateAnswer(index) {
    if (questions[index]["type"] == 1) {
        answers[questions[index]["id"]] = $('#qmcq .option button.active').attr('data-id');
    } else {
        answers[questions[index]["id"]] = $('#qinteger_answer input').val();
    }
    return true;
}

function showAnswer(index) {
    if (dirty_answers[index] == -1) {
        dirty_answers[index] = 0;

        mixpanel.track("Question " + index);

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
                options_html += `<div class="option col-6 text-center mt-2"> \
                <button type="button" class="btn btn-outline-info" data-id="`+options[i]["id"]+`" onclick="makeActive(`+i+`)">` + options[i]["text"] +
                `</div>`;

                // <input type="radio" value="B or C" name="answer_1"  \
                // id="id_10" class="cls_1"/> \
                //     <label class="answer-label" for="id_10">`

            }

            console.log(options_html);

            $('#qmcq .options').html(options_html);
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

function visit_website() {
    mixpanel.track("Visit NG Website");
    window.location.href='http://navgurukul.org';
} 

function learn_coding() {
    mixpanel.track("Visit SARAL");
    window.location.href='http://saral.navgurukul.org';
}
function submitTest() {
    updateAnswer(current_question);    
    $.ajax({
        url: base_url+"/on_assessment/questions/"+enrolment_key+"/answers",
        type: 'POST',
        data: JSON.stringify(answers),
        contentType: 'application/json; charset=utf-8', 
        dataType: 'json',
        success: function(data, resp) {
            $('#question_answer_page').slideUp(slide_up_time);
            $("#end_page").slideDown(slide_down_time);
            mixpanel.track("Answers Submitted");
        },
    });
}

$(document).ready(function() {
    if (DEBUG) {
        // landing_page_submit();
        // personal_details_submit();
        // time_aware_submit();
    }
    else {
        $.get(base_url+"/on_assessment/validate_enrolment_key/"+enrolment_key,
        {},
        (data, resp) => {
            if (data["keyStatus"]=="testAnswered") {
                $('.page').hide();
                $('#end_page').show();
            }
        });
    }
});
