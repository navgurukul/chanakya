from app import app
from flask import render_template, request, session, flash, redirect, url_for
import random
import logging


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
    return render_template("test.html")

@app.route("/end")
def show_test_end():
    return render_template("end.html")

######## APIS can be configured as another microservice ?? ########
############ REST APIS ##############
@app.route("/create-enrollment-number/<phone_number>", methods=["PUT"])
def create_enrollment_number(phone_number):
    return get_random_string(phone_number)

