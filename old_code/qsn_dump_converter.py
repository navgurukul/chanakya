'''
    The script is to convert the old qsn_dump file dictionary structure to the new dictionary structure
    as per base the current payload structure.
'''

from qsn_dump import questions
for question in questions:
    options = []

    for option in question.get('options'):
        if option == '':
            continue
        option_dict = {}
        option_dict['en_text'] = option
        option_dict['hi_text'] = option
        option_dict['correct'] = True if option == question.get('answer') else False

        options.append(option_dict)
    question['options'] = options
    del question['answer']
from pprint import pprint
pprint(questions)
