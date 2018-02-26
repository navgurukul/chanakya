import random, string

from app import app, exotel
from flask import render_template, request, session, flash, redirect, url_for
from datetime import datetime
from app import repos
from app.helper_methods import ( get_random_string,
                                 calculate_marks_and_dump_data,
                                 get_time_remaining, get_question_set
                                )

global_questions = False

################### VIEWS #######################
def go_to_page(check=None):
    if check:
        return redirect('/test')
    return redirect(url_for(session.get('page')))

@app.before_request
def before_request():
    if request.endpoint not in ("create_enrolment_key", 
                                "create_question",
                                "exotel_talk_to_ng",
                                "exotel_enroll_for_test",
                                "enter_enrolment",
                                "on_crm_potential_stage_edit"):
        if not session.get("page"):
            session["page"] = "enter_enrolment"
            return go_to_page()

@app.route('/')
@app.route('/enter-enrolment')
def enter_enrolment():
    if not session.get("page"):
        session["page"] = "enter_enrolment"
    if session.get("page") == "enter_enrolment":
        enrolment_key = request.args.get("enrolment_key")
        if enrolment_key and repos.is_valid_enrolment(enrolment_key):
            session["enrolment_key"]   = enrolment_key
            session["page"] = "before_test"
        else:
            return render_template("enter_enrolment.html")
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
            global global_questions
            if not global_questions: global_questions = repos.get_all_questions()
            questions = global_questions
            session["questions"] = questions
            session["test_start_time"]  = datetime.utcnow()
            session['total_time_shown'] = 0
            session["test_score"]       = 0
        time_remaining = get_time_remaining(session.get("test_start_time")) - session['total_time_shown']
        if time_remaining > 0:
            session['set_name'], session['is_last_set'], question_set, time_to_show = get_question_set(session.get('questions'), time_remaining)
            session['last_time_shown']  = time_to_show 
            session['question_set']     = question_set
            return render_template("test.html", question_set=question_set, time_remaining=time_to_show)
        else:
            return "timer has expired, call Navgurukul for more details."
    return go_to_page()

@app.route("/end", methods=["GET", "POST"])
def end():
    if session.get("page") == "test" and request.method == "POST":
        question_set = session.get("question_set")
        other_details = {
            "start_time":session.get("test_start_time"),
            "submit_time":datetime.utcnow(),
            "enrolment_key":session.get("enrolment_key"),
            "set_name": session.get("set_name")
        }
        session['total_time_shown'] += session['last_time_shown']
        data_dump = calculate_marks_and_dump_data(question_set, request.form)
        repos.save_test_result_and_analytics(data_dump, other_details)
        session["test_score"] += data_dump.get("total_marks")
        if session.get('is_last_set'):
            session["page"] = "end"
    elif session.get("page") == "end":
        if request.method == "GET":
            return render_template("ask_details.html")
        elif request.method == "POST":
            student_details = repos.can_add_student(session.get("enrolment_key"), request.form)
            if student_details:
                repos.add_to_crm(student_details, session)
                # repos.add_to_crm_if_needed(student_details['potential_name'], stage="Entrance Test")
                session.clear()
                return render_template("thanks.html")
            else:
                flash("Unable to Save Your Details, Contact Navgurukul.")
    return go_to_page()
    #go_to_page(check=True)

@app.route("/create-question", methods=["GET", "POST"])
def create_question():
    #no-authentication: dangerous ??
    t1 = datetime.now()
    if request.method == "GET":
        return render_template("create_question.html")
    elif request.method == "POST":
        en_question_text = request.form.get("en_question_text") 
        hi_question_text = request.form.get("hi_question_text") 
        question_type = request.form.get("question_type") 
        difficulty = request.form.get("difficulty") 
        category = request.form.get("category") 

        option_1 = request.form.get("option_1") 
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

############ REST APIS ##############
@app.route("/create-enrolment-key/<phone_number>", methods=["PUT"])
def create_enrolment_key(phone_number):
    enrolment_key =  get_random_string()
    crm_potential_id  = repos.add_enrolment_to_crm(phone_number, enrolment_key)
    enrolment_key = repos.add_enrolment_key(enrolment_key, phone_number, crm_potential_id)
    if enrolment_key:
        return enrolment_key, 201
    else:
        return  "Unable to register", 400

@app.route("/exotel_talk_to_ng")
def exotel_talk_to_ng():
    student_mobile = request.args.get("CallFrom")
    if not student_mobile:
        return "ERROR", 500 #log
    if student_mobile[0] == "0":
        student_mobile = student_mobile[1:]
    repos.add_to_crm_if_needed(student_mobile, stage="Requested Callback")
    return "SUCCESS", 200

@app.route("/exotel_enroll_for_test")
def exotel_enroll_for_test():
    # get the student mobile number
    student_mobile = request.args.get("CallFrom")
    if not student_mobile:
        return "ERROR", 500
    if student_mobile[0] == "0":
        student_mobile = student_mobile[1:]

    # generate an enrolment number for the student
    enrolment_key     =  get_random_string()
    crm_potential_id  = repos.add_enrolment_to_crm(student_mobile, enrolment_key)
    enrolment_key     = repos.add_enrolment_key(enrolment_key, student_mobile, crm_potential_id)
    print("potential id", crm_potential_id)
    print("enrolment key", enrolment_key)
    if not enrolment_key:
        return "ERROR", 500
    
    repos.add_to_crm_if_needed(student_mobile, stage="Enrolment Key Generated")
    
    # send an SMS with the enrolment number
    #TODO: Implement the real message when we buy exotel.
    message = app.config.get("TEST_ENROLL_MSG").format(test_url=enrolment_key)
    # test_message = "This is a test message being sent using Exotel with a (hello) and (123456789). If this is being abused, report to 08088919888"
    exotel.sms(app.config.get("EXOTEL_NUM_SMS"), student_mobile, message)

    return "SUCCESS", 200


####################
## Zoho Web Hooks ##
####################

@app.route("/zoho_crm/on_potential_stage_change")
def on_crm_potential_stage_edit():
    
    # get the student details
    enrolment_key = request.args.get("enrolment_key")
    student_mobile = request.args.get("mobile")
    stage = request.args.get("stage")

    # figure out the next actions that need to be taken
    stage_actions = app.config['POTENTIAL_STUDENT_STAGE_NOTIFS']
    actions = stage_actions.get(stage)
    print(actions)
    if actions is None:
        return "No action needs to be taken", 200
    
    # trigger the sms
    if actions.get("sms"):
        #TODO: Implement the real message when we buy exotel.
        message = actions['sms']
        exotel.sms(app.config.get("EXOTEL_NUM_SMS"), student_mobile, message)

    # trigger the outbound call
    if actions.get("exotel_obd_id"):
        #TODO: Need to integrate this when we add the outbound flows in exotel.
        pass

    # trigger an email
    if actions.get("referral_email_template"):
        #TODO: Need to integrate this when we add this support in the platform.
        pass

    return "All the required actions are already taken.", 200
