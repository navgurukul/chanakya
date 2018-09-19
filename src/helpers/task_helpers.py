from chanakya.src.models import Questions
from chanakya.src import app
from bs4 import BeautifulSoup
from flask import render_template
from subprocess import Popen, PIPE, STDOUT
import os, pandas, requests
from io import BytesIO


def render_pdf_phantomjs(template_name , **kwargs):
    """mimerender helper to render a PDF from HTML using phantomjs."""
    # The 'makepdf.js' PhantomJS program takes HTML via stdin and returns PDF binary via stdout
    html = render_template(template_name, **kwargs)
    p = Popen(['phantomjs', '%s/scripts/pdf.js' % os.path.dirname(os.path.realpath(__file__))], stdout=PIPE, stdin=PIPE, stderr=STDOUT)
    some = p.communicate(input=html.encode('utf-8'))[0]
    return some


def get_attempts(row, enrollment):
    """
        Helps to extract the attempts of student from dataframe row which is created by pandas
        by reading a csv format of question 1-18 with student answer.

        Params:
        `row`: row dataframe of pandas which carry a row of student data from which we will get student question attempts.
        `enrollment`: the enrollment instance which we need to extract question set.

    """
    attempts = []
    question_set = enrollment.question_set
    questions = question_set.get_questions()
    
    for i in range(0,18):
        question_num = str(i+1)
        attempt = {}
        question = questions[i]
        question_attempt = row.get(question_num)

        if question_attempt:
            if question.type.value == 'MCQ':
                options = question.options.all()
                option_index = ord(question_attempt)-ord('A')
                attempt['selected_option_id'] = options[option_index].id
                attempt['question_id'] = question.id
            else:
                attempt['question_id'] = question.id
                attempt['answer'] = question_attempt
            attempts.append(attempt)
    return attempts

def get_dataframe_from_csv(csv_url):
    """
        Helps to create a dataframe using pandas for the CSV file containing the partner offline test details.
        Require the url of CSV File
        Params:
            `args`: "csv_url" the Url of the csv file on s3
    """


    response = requests.get(csv_url)
    csv_buffer = BytesIO(response.content)
    dataframe = pandas.read_csv(csv_buffer, keep_default_na=False)

    rows = [row[1] for row in dataframe.iterrows()]
    return rows
