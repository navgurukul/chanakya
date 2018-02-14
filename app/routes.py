from app import app
from flask import render_template, request, session, flash, redirect, url_for
import random
import string
from app import repos

global_q_set = None

################### VIEWS #######################
@app.route('/')
@app.route('/enter-enrolment')
def enter_enrolment():
    if session.get("test_started") == "yes":
        return redirect(url_for('test'))
    if session.get("test_started") == "no":
        return redirect(url_for('before_test'))
    else:
        enrolment_key = request.args.get("enrolment_key")
        if enrolment_key and repos.is_valid_enrolment(enrolment_key):
            session["enrolment_key"]   = enrolment_key
            session["q_no"] = 1
            session["test_started"] = "no"
            return redirect(url_for('before_test'))
        else:
            return render_template("enter_enrolment.html")

@app.route('/before-test', methods=["GET", "POST"])
def before_test():
    if session.get("test_started") == "yes":
        return redirect(url_for('test'))
    if session.get("test_started") == "no":
        if request.method == "GET":
            return render_template("before_test.html")
        elif request.method == "POST":
            if repos.can_start_test(session["enrolment_key"]):
                session["test_started"] = "yes"
                return redirect(url_for('test'))
            else:
                return "Unable to Start your Test, Contact Navgurukul", 400
    else:
        return redirect(url_for('/enter-enrolment'))

@app.route('/test', methods=["GET", "POST"])
def test():
    if session.get("test_started") == "yes":
        if not session.get("questions"):
            global global_q_set
            if not global_q_set:
                global_q_set = repos.get_global_q_set()
            q_set = repos.get_q_set(global_q_set)
            questions = repos.get_all_questions(q_set)
            session["questions"] = questions
        return render_template("test.html", questions=session.get("questions"))
    elif session.get("test_started") == "no":
        return redirect(url_for('before_test'))
    else:
        return redirect(url_for('enter_enrolment'))

@app.route("/end")
def show_test_end():
    #pop all session keys
    return render_template("end.html")

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
@app.route("/create-enrolment-key/<phone_number>", methods=["PUT"])
def create_enrolment_key(phone_number):
    enrolment_key =  get_random_string()
    enrolment_key = repos.add_enrolment_key(enrolment_key, phone_number)
    if enrolment_key:
        return enrolment_key, 201
    else:
        return  "Unable to register", 400

#helper methods
def get_random_string():
    ALPHABETS, NUMBERS =  string.ascii_uppercase, string.digits 
    return "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(2)])
