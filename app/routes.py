from app import app
from flask import render_template, request, session, flash, redirect, url_for
import random
import logging
import string
from app import repos


################### VIEWS #######################
@app.route('/', methods=["GET", "POST"])
def start():
    if session.get("en"):
        return redirect(url_for('render_test'))
    else:
        if request.method == "GET":
            return render_template("start.html")
        elif request.method == "POST":
            enrollment_number = request.form.get("enrollment_number")
            if enrollment_number == "ABC12": #ToDo DB Logic
                session["en"]   = enrollment_number
                session["q_no"] = 1
                return redirect(url_for('render_test'))
            else:
                #flash("Error")
                return redirect(url_for('start'))

@app.route('/test', methods=["GET", "POST"])
def render_test():
    print(session.get("en"))
    if session.get("en"):
        return render_template("test.html")
    return redirect(url_for('start'))

@app.route("/end")
def show_test_end():
    return render_template("end.html")

@app.route("/create-question", methods=["GET", "POST"])
def create_question():
    #no-authentication: dangerous ??
    if request.method == "GET":
        return render_template("create_question.html")
    elif request.method == "POST":
        question_text = request.form.get("question_text") 
        question_type = request.form.get("question_type") 
        difficulty = request.form.get("difficulty") 
        category = request.form.get("category") 
        if question_type in ("MCQ", "short_answer"):
            option_1 = request.form.get("option_1") 
        if question_type == "MCQ":
            option_2 = request.form.get("option_2") 
            option_3 = request.form.get("option_3") 
            option_4 = request.form.get("option_4") 
        question_details =      {
                                    "question_text":question_text,
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
@app.route("/create-enrollment-key/<phone_number>", methods=["PUT"])
def create_enrollment_key(phone_number):
    enrollment_key =  get_random_string()
    enrollment_key = repos.add_enrollment_key(enrollment_key, phone_number)
    if enrollment_key:
        return enrollment_key, 201
    else:
        return  "Unable to register", 400

#helper methods
def get_random_string():
    ALPHABETS, NUMBERS =  string.ascii_uppercase, string.digits 
    return "".join([ random.choice(ALPHABETS) for x in range(3)]) + "".join([ random.choice(NUMBERS) for x in range(2)])
