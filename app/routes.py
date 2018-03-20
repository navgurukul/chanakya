import random, string
from app import app, exotel
from flask import render_template, request, session, flash, redirect, url_for
from datetime import datetime, timedelta
from app import repos
from app.logger import loggly
from app.helper_methods import ( get_random_string,
                                 get_data_from_enrolment_file,
                                 calculate_marks_and_dump_data,
                                 get_time_remaining, get_question_set
                                )
import redis
import json

redis_obj = redis.Redis()

def get_all_questions():
    all_questions = redis_obj.get('all_question')
    if not all_questions:
        all_questions = repos.get_all_questions()
        redis_obj.set('all_questions', json.dumps(all_questions))
        return all_questions
    else:          
        return json.loads(all_question)

def go_to_page(check=None): return redirect(url_for(session.get('page')))

@app.errorhandler(Exception)
def handle_all_exceptions(e):
    exception_details = {
        "Exception":e,
        "client_details":{
            "enrolment_key":session.get('enrolment_key'),
            "page":session.get("page"),
            "form":dict(request.form),
            "args":dict(request.args)
        }
    }

    loggly.error(str(exception_details), exc_info=True)
    return render_template("error.html")

@app.before_request
def before_request():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=7)
    if request.endpoint not in ("create_enrolment_key", 
                                "create_question",
                                "view_result",
                                "exotel_talk_to_ng",
                                "exotel_enroll_for_test",
                                "enter_enrolment",
                                "on_crm_potential_stage_edit"):
        if not session.get("page"):
            session["page"] = "enter_enrolment"
            return go_to_page()

################### VIEWS #######################
@app.route('/view-result/<enrolment_key>')
def view_result(enrolment_key):
    data, error = get_data_from_enrolment_file(enrolment_key)
    return render_template("view_result.html", data=data, error=error)

@app.route('/')
@app.route('/enter-enrolment')
def enter_enrolment():
    if not session.get("page"):
        session["page"] = "enter_enrolment"
    if session.get("page") == "enter_enrolment":
        enrolment_key = request.args.get("key")
        if enrolment_key:
            if repos.is_valid_enrolment(enrolment_key):
                session["enrolment_key"]   = enrolment_key
                if repos.can_start_test(session["enrolment_key"]):
                    session["page"] = "ask_personal_details"
                    return go_to_page()
                else:
                    flash("Aapka test use ho chuka hai, jyada details k liye Navgurukul ko call krre")
            else:
                flash("Niche diye gye box me valid Enrolment key likhe")
        return render_template("enter_enrolment.html")
    return go_to_page()

@app.route('/ask-personal-details', methods=["GET", "POST"])
def ask_personal_details():
    if session.get("page") == "ask_personal_details":
        if request.method == "GET":
            return render_template("ask_personal_details.html")
        elif request.method == "POST":
            student_details = repos.can_add_student(session.get("enrolment_key"), request.form, action='create')
            if student_details:
                repos.add_to_crm(student_details, session, 'Personal Details Submitted')
                #repos.create_dump_file(session.get('enrolment_key'), "\nuser_personal_details=" +str(student_details))
            session["page"] = "before_test"
    return go_to_page()

@app.route('/before-test', methods=["GET", "POST"])
def before_test():
    if session.get("page") == "before_test":
        if request.method == "GET":
            return render_template("before_test.html")
        elif request.method == "POST":
            session["page"] = "test"
    return go_to_page()

@app.route('/test')
def test():
    if session.get("page") == "test":
        global_questions = get_all_questions()
        if not session.get("test_start_time"):
            session["test_start_time"]   = datetime.utcnow()
            session["last_submit_time"]  = session["test_start_time"]
            session["test_score"]        = 0
            session["submitted_set"]     = None
        time_remaining = get_time_remaining(session.get("last_submit_time"), session['submitted_set'])
        if time_remaining > 0:
            session['set_name'], session['is_last_set'], question_set, time_to_show = get_question_set(global_questions, time_remaining)
            session['question_set']     = question_set
            return render_template("test.html", question_set=question_set, time_remaining=time_to_show)
        else:
            flash("timer has expired, call Navgurukul for more details.")
            session['page'] = 'end'
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
        session["last_submit_time"]  = datetime.utcnow()
        data_dump = calculate_marks_and_dump_data(question_set, request.form)

        stuff_to_add ='''
qa_%s = {
'questions':%s,
'answers':%s
}

        '''%( other_details.get('set_name'), str(question_set), str(dict(request.form)))
        repos.create_dump_file(session['enrolment_key'], stuff_to_add)


        repos.save_test_result_and_analytics(data_dump, other_details)
        session["test_score"] += data_dump.get("total_marks")
        session['submitted_set'] = session.get('set_name')

        student_details = repos.can_add_student(session.get("enrolment_key"), request.form, action='update')
        if student_details:
            repos.add_to_crm(student_details, session, 'Entrance Test')

        if session.get('is_last_set'):
            session["page"] = "end"
        return ""
    elif session.get("page") == "end":
        if request.method == "GET":
            return render_template("ask_details.html")
        elif request.method == "POST":
            student_details = repos.can_add_student(session.get("enrolment_key"), request.form, action='update')
            if student_details:
                repos.add_to_crm(student_details, session, 'All Details Submitted')
                #repos.create_dump_file(session.get('enrolment_key'), "\nuser_details=" +str(student_details))
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
            print("question is created, successfully")
            return redirect(url_for("create_question"))
        else:
            flash("question not created: %s" %error)
            print("question not created: %s" %error)
            return redirect(url_for("create_question"))

############ REST APIS ##############

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
    print("enrolment key", enrolment_key)
    print("crm_potential_id", crm_potential_id)
    if not enrolment_key:
        return "ERROR", 500
    
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
