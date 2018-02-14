from app import app
from flask import render_template, request, session, flash, redirect, url_for
import string
from app import repos
from helper_methods import get_random_string

global_q_set = None

################### VIEWS #######################
def go_to_page():
    return redirect(url_for(session.get('page')))

@app.before_request():
def go_to_page():
    if not session.get("page"):
        session["page"] = "enter_enrolment"
        return go_to_page()

@app.route('/')
@app.route('/enter-enrolment')
def enter_enrolment():
    if session.get("page") == "enter_enrolment"
        enrolment_key = request.args.get("enrolment_key")
        if enrolment_key and repos.is_valid_enrolment(enrolment_key):
            session["enrolment_key"]   = enrolment_key
            session["q_no"] = 1
            session["page"] = "before_test"
        else:
            pass
            #flash - error about enrolment
    return go_to_page()
        

@app.route('/before-test', methods=["GET", "POST"])
def before_test():
    if session.get("page") == "before_test":
        if request.method == "GET":
            return render_template("before_test.html")
        elif request.method == "POST":
            if repos.can_start_test(session["enrolment_key"]):
                session["page"] = "test"
            else:
                return "Unable to Start your Test, Contact Navgurukul", 400
    return go_to_page()

@app.route('/test')
def test():
    if session.get("page") == "test":
        if not session.get("questions"):
            global global_q_set
            if not global_q_set:
                global_q_set = repos.get_global_q_set()
            q_set = repos.get_q_set(global_q_set)
            questions = repos.get_all_questions(q_set)
            session["questions"] = questions
        return render_template("test.html", questions=session.get("questions"))
    return go_to_page()

@app.route("/end", methods=["GET", "POST"])
def show_test_end():
    if session.get("page") == "test" and request.method == "POST":
        questions = session.get("questions")
        if questions:
            data_for_analytics = calculate_marks_and_dump_data(questions, request.form)
            repos.save_test_result(session.get("enrollment_key"), data_for_analytics)
            session["page"] = "end"
        return render_template("ask_details.html")
    elif session.get("page") == "end" and request.method == "POST":
        return render_template("thanks.html")
    return go_to_page()


@app.route("/create-question", methods=["GET", "POST"])
def create_question():
    #no-authentication: dangerous ??
    if request.method == "GET":
        return render_template("create_question.html")
    elif request.method == "POST":
        en_question_text = request.form.get("en_question_text") 
        hi_question_text = request.form.get("hi_question_text") 
        question_type = request.form.get("question_type") 
        difficulty = request.form.get("difficulty") 
        category = request.form.get("category") 
        #if question_type in ("MCQ", "short_answer"):
        option_1 = request.form.get("option_1") 
        #if question_type == "MCQ":
        option_2 = request.form.get("option_2") 
        option_3 = request.form.get("option_3") 
        option_4 = request.form.get("option_4") 
        question_details =      {
                                    "en_question_text":en_question_text,
                                    "hi_question_text":hi_question_text,
                                    "question_type":question_type,
                                    "difficulty":difficulty,
                                    "category":category,
                                    "options":[option_1, option_2, option_3, option_4]
                                }
        is_question_created, error = repos.create_question(question_details)
        if is_question_created:
            flash("question is created, successfully")
            return redirect(url_for("create_question"))
        else:
            flash("question not created: %s" %error)
            return redirect(url_for("create_question"))

######## APIS can be configured as another microservice ?? ########
############ REST APIS ##############
#TODO: @Shanu: Isko nikaal dena in case you don't need it. It is redundant after `exotel_enroll_for_test()`
@app.route("/create-enrolment-key/<phone_number>", methods=["PUT"])
def create_enrolment_key(phone_number):
    enrolment_key =  get_random_string()
    enrolment_key = repos.add_enrolment_key(enrolment_key, phone_number)
    if enrolment_key:
        return enrolment_key, 201
    else:
        return  "Unable to register", 400

@app.route("/exotel_enroll_for_test")
def exotel_enroll_for_test():
    # get the student mobile number
    student_mobile = request.args.get("CallFrom")
    if not student_mobile:
        return "ERROR", 500
    if student_mobile[0] == "0":
        student_mobile = student_mobile[1:]

    # generate an enrolment number for the student
    enrolment_key =  get_random_string()
    enrolment_key = repos.add_enrollment_key(enrolment_key, student_mobile)
    if not enrolment_key:
        return "ERROR", 500
    
    # send an SMS with the enrolment number
    #TODO: Implement exotel API when we purchase plan. Trial plan doesn't support sending SMS.
    message = app.config.get("TEST_ENROLL_MSG").format(enrolment_num=enrolment_key)
    print('------------------')
    print('TODO')
    print(message)
    print('This message will be sent on {number}'.format(number=student_mobile))
    print('------------------')

    return "SUCCESS", 200
