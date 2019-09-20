var DEBUG = true;
var current_language = 'hn';

Sentry.init({
    dsn: 'https://15afe9937fcb4b32b902ab2795ae6d07@sentry.io/1421126',
    environment: DEBUG ? 'staging' : 'production'
});

if (!DEBUG) {
    var enrolment_key = window.location.href.split('k/').slice(-1);
    var base_url="/api";
} else {
    var enrolment_key = "H7KECR";
    var base_url="http://localhost:3000";
}

var slide_up_time = 600;
var slide_down_time = slide_down_time;
var questions = [];
var passage = [];
var answers = {};
var dirty_answers = [];
var current_question = 0;
var qDisplayed = false;

function appending(error) {
    $('.errors').html('');
    $('.errors').html(error);
}

function landing_page_submit() {
    mixpanel.track("Welcome Page");
    $("#landing_page").slideUp(slide_up_time);
    $("#no_cheating_promise").slideDown(slide_down_time);
};

function no_cheating_promise_submit() {
    mixpanel.track("No Cheating Promise");
    $("#no_cheating_promise").slideUp(slide_up_time);
    $("#time_aware").slideDown(slide_down_time);
    fetchQuestionsAndOptions();
}

function fetchQuestionsAndOptions(){
    $.post(base_url+"/englishTest/questions/"+enrolment_key,
        {},
        (data, resp) => {
            questions = data["data"].questions;
            passage = data["data"].passage;
            $("#page2").slideUp(slide_up_time);
            $("#time_aware").slideDown(slide_down_time);                 
            if (!qDisplayed) {
                dQuestions();
            }
        },
        'json'
    )
    .fail(function(response) {
        mixpanel.track("Error in fetching questins and options.");
        Sentry.captureException(response);
    });
}

function time_aware_submit() {
    // show question_answer and Passage page
    $("#time_aware").slideUp(slide_up_time);
    $("#Passage_page").slideDown(slide_down_time);
    $("#Passage_page .ptext").html(getPassage(passage));
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
            $("#time_to_show_passage").html("<h4>Time Over Submitting Your Test Now.</h4>");
            submitTest();
            $('.progress').hide();
            clearInterval(do_it);
        } else if (time_remaining <= 15) {
            msg = "<h4>Time Over Submitting Your Test Now "+ ".".repeat(Math.floor(time_remaining)%4+1) + " </h4>";
            $("#time_to_show").html(msg);
            $("#time_to_show_passage").html(msg);
        } else {
            $("#time_to_show").html("Time Remaining: "+minutes+" minutes "+seconds+" seconds.");
            $("#time_to_show_passage").html("Time Remaining: "+minutes+" minutes "+seconds+" seconds.");
        }
    }, 1000); 
}

function getPassage() {
    if(passage) {
        return passage[0].passage + "<br>"
    }
}

function goOnQuestions() {
    mixpanel.track("Passage Page");
    $("#Passage_page").slideUp(slide_up_time);
    $("#question_answer_page").slideDown(slide_down_time);
    displayQuestion(current_question);
}

function goOnPassage() {
    mixpanel.track("Back to the Passage Page");
    $("#question_answer_page").slideUp(slide_up_time);
    $("#Passage_page").slideDown(slide_down_time);
}

function dQuestions() {
    qDisplayed = true;

    for (i=0; i<questions.length; i++) {
        dirty_answers.push(-1);
    }

    $('#btns_next_submit').show("slow");
    displayQuestion(0);
}

function getQuestion(question) {
    if (question["question"]) {
        return question["question"]+"<br>";
    }
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
function displayQuestion(index) {    
    $("#on_question").html("Yeh Question no. <b>" + (index+1)+"</b> (out of <b>"+questions.length+"</b> questions)");
    $("#kitne_questions").html("Aapne <b>"+kitne_kar_liye(answers)+"</b> questions already attempt kar liye hai!");
    $("#on_question_passage").html("Yeh Question no. <b>" + (index+1)+"</b> (out of <b>"+questions.length+"</b> questions)");
    $("#kitne_questions_passage").html("Aapne <b>"+kitne_kar_liye(answers)+"</b> questions already attempt kar liye hai!");


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
            $('#qinteger_answer').slideUp(slide_up_time);
            $('#qmcq').slideDown(slide_down_time);
            $('#qmcq .qtext').html(getQuestion(question));
            var options = question["options"];
            var options_html = "";

            for(var i=0; i<options.length; i++) {
                options_html += `<div class="option col-6 text-center mt-2"> \
                <button type="button" class="btn btn-outline-info" data-id="`+ options[i]["id"] + `" onclick="makeActive(`+ i +`)">` + options[i]["text"] +
                `</div>`;
            }

            $('#qmcq .options').html(options_html);
        }
    }

    showAnswer(index);
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
    }

    return true;
}

function kitne_kar_liye(answers) {
    var itne_kar_liye = 0;
    var keys = Object.keys(answers);
    for (var i=0; i<keys.length; i++) {
        if (answers[keys[i]]!= undefined & answers[keys[i]]!="") {
            itne_kar_liye++;
        }
    }
    return itne_kar_liye;
}

function makeActive(index) {
    $('#qmcq .option button').each(function(i, obj) {
        if (i == index) {
            $(this).addClass('active');
        } else {
            $(this).removeClass('active');
        }
    });
}

function submitTest() {
    updateAnswer(current_question);
    $.ajax({
        url: base_url+"/englishTest/questions/"+enrolment_key+"/answers",
        type: 'POST',
        data: JSON.stringify(answers),
        contentType: 'application/json; charset=utf-8', 
        dataType: 'json',
        success: function(data, resp) {
            $('#question_answer_page').slideUp(slide_up_time);
            $("#thank_you_page").slideDown(slide_down_time);
            mixpanel.track("Answers Submitted");
        },
        error: function(error) {
            mixpanel.track("Error in Answers Submission");
            Sentry.captureException(response);
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

$(document).ready(function() {
    if (!DEBUG) {
        landing_page_submit();
        time_aware_submit();
    }
    $.get(base_url + "/englishTest/validate_enrolment_key/" + enrolment_key,
    {},
    (data, resp) => {
        if (data["keyStatus"] == "testAnswered") {
            $('.page').hide();
            $('#thank_you_page').show();
        }
        
    }).fail(function(response) {
        $("#myModal").modal();
        Sentry.captureException(response);
    });
});

$(function(){
    $('.lang').hide();
    $('.lang.hi').show();

    $( ".lang_picker" ).change(function() {
        current_language = $(this).children("option:selected").val();
        displayQuestion(current_question);
        $('.lang').hide();
        $('.lang.'+current_language).show();
    });

});