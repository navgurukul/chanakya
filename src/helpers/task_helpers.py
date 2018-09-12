from chanakya.src.models import Questions
from chanakya.src import app

from flask import render_template
from subprocess import Popen, PIPE, STDOUT
import os

# for the route question/create
def get_options_list(args):
    '''
        It is a helper method which parse the options of question sent while creating it
        and return a dictionary containing the options

        params : args from the parse_args() method

        return [
            {
                'en_text':'something',
                'hi_text':'something',
                'correct': True
            },
            {
                'en_text':'something',
                'hi_text':'something',
                'correct': False
            },
        ]
    '''
    options = []

    options_in_en =  args.get('option_en_text')
    options_in_hi =  args.get('option_hi_text')
    correct_answers = args.get('correct_answers')

    number_of_option = len(options_in_en)

    for i in range(number_of_option):
        option = {}
        option['en_text'] = options_in_en[i]
        option['hi_text'] = options_in_hi[i]

        if str(i+1) in correct_answers:
            option['correct'] =  True

        options.append(option)
    return options

def parse_question_dict(args):
    '''
        It used to parsed the question as a dictionary to upload save it in the database format required by
        Questions.create_question()

        params: args from the parse_args() method

        return {
            'hi_text':'some question',
            'en_text':'some question',
            'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
            'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
            'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']

            'options':[
                {
                    'en_text':'something',
                    'hi_text':'something',
                    'correct': True
                },
                {
                    'en_text':'something',
                    'hi_text':'something',
                    'correct': False
                }
            ]
        }
    '''
    questions = {}

    # contains the text of question
    questions['hi_text'] = args.get('hi_question_text')
    questions['en_text'] = args.get('en_question_text')
    questions['difficulty'] = args.get('difficulty')
    questions['topic'] = args.get('topic')
    questions['type'] = args.get('type')
    questions['options'] = get_options_list(args)

    print(questions)
    return questions

def render_pdf_phantomjs(template_name , **kwargs):
    """mimerender helper to render a PDF from HTML using phantomjs."""
    # The 'makepdf.js' PhantomJS program takes HTML via stdin and returns PDF binary via stdout
    html = render_template(template_name, **kwargs)
    p = Popen(['phantomjs', '%s/../scripts/pdf.js' % os.path.dirname(os.path.realpath(__file__))], stdout=PIPE, stdin=PIPE, stderr=STDOUT)
    return p.communicate(input=html.encode('utf-8'))[0]
