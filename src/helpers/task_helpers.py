from chanakya.src.models import Questions
from chanakya.src import app


# for the route question/create
def parse_option_args_to_dict(args):
    '''
        It is a helper method which parse the options of question sent while creating it
        and return a dictionary containing the options

        params : args from the parse_args() method

        return {
            'option1':{
                'en_text':'something',
                'hi_text':'something'
            },
            'option2':{
                'en_text':'something',
                'hi_text':'something'
            },
            'option3':{
                'en_text':'something',
                'hi_text':'something'
            },
            'option4':{
                'en_text':'something',
                'hi_text':'something'
            }

        }
    '''
    option = {}

    option1_en_text = args.get('option1_en_text')
    option1_hi_text = args.get('option1_hi_text')
    if option1_en_text and option1_hi_text:
        option.update({'option1':{'en_text': option1_en_text,'hi_text':option1_hi_text}})

    option2_en_text = args.get('option2_en_text')
    option2_hi_text = args.get('option2_hi_text')
    if option2_en_text and option2_hi_text:
        option.update({'option2':{'en_text': option2_en_text,'hi_text':option2_hi_text}})

    option3_en_text = args.get('option3_en_text')
    option3_hi_text = args.get('option3_hi_text')
    if option3_en_text and option3_hi_text:
        option.update({'option3':{'en_text': option3_en_text,'hi_text':option3_hi_text}})

    option4_en_text = args.get('option4_en_text')
    option4_hi_text = args.get('option4_hi_text')
    if option4_en_text and option4_hi_text:
        option.update({'option4':{'en_text': option4_en_text,'hi_text':option4_hi_text}})

    return option

def parse_question_args_to_dict(args):
    '''
        It used to parsed the question as a dictionary to upload save it in the database format required by
        Questions.create_question()

        params: args from the parse_args() method

        return {
            'text':{
                'hi_question_text':'some question',
                'en_question_text':'some question'
            },
            'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
            'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
            'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
            'answer': answer, // answer for the question can contain both Interger Value or the Option Name

            // option will be only there when type == 'MQC'
            'option':{
                'option1':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option2':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option3':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option4':{
                    'en_text':'something',
                    'hi_text':'something'
                }

            }
        }
    '''
    questions = {}

    # contains the text of question
    questions['text'] = {}

    questions['text']['hi_question_text'] = args.get('hi_question_text')
    questions['text']['en_question_text'] = args.get('en_question_text')
    questions['difficulty'] = args.get('difficulty')
    questions['topic'] = args.get('topic')
    questions['type'] = args.get('type')
    questions['answer'] = args.get('answer')

    # parsing the option for mcq question
    if questions['type'] == 'MQC':
        questions['option'] = parse_option_args_to_dict(args)
    print(questions)
    return questions


def get_the_option_as_list(question):
    '''
        Questions object option serializer. The funtion is to get out all options from the question object

        params: Questions model instance

        return:
            options = [
                option1,
                option2,
                option3,
                option4,
            ]
            answer = 3 //index of the answer in options
    '''
    question_options = question.options.all()
    options = []
    answer = None
    for question_option in question_options:
        option={}
        if int(question.answer) == question_option.id:
            answer = question_options.index(question_option)

        option['hi'] = question_option.hi_text
        option['en'] = question_option.en_text
        options.append(option)
    return options, answer


def get_question_as_dict(question):
    '''
        function to serialize question instance

        params: question object instance

        return {
            'id': 1,
            'question_text':{
                'hi_question_text':'some text question',
                'en_question_text':'some text question'
            },
            'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
            'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
            'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
            'answer': answer, // answer for the question can contain both Interger Value or the Option Name

            // option will be only there when type == 'MQC'
            'option':{
                'option1':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option2':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option3':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option4':{
                    'en_text':'something',
                    'hi_text':'something'
                }

            }

        }
    '''
    question_data = {}
    question_data['question_text'] = {}
    question_data['question_text']['hi_question_text'] = question.hi_text
    question_data['question_text']['en_question_text'] = question.en_text
    question_data['difficulty'] = question.difficulty.value
    question_data['topic'] = question.topic.value
    question_data['type'] = question.type.value

    # MCQ question will have options in it
    if question.type.value == 'MQC':
        options, answer = get_the_option_as_list(question)
        question_data['option'] = options
        question_data['answer'] = answer
    else:
        question_data['answer'] = question.answer
    question_data['id'] = question.id
    return question_data


def get_the_questions_as_list():
    '''
        this function is to get the list of all the question from the database as a dictionary

        question = {
            'id': 1,
            'question_text':{
                'hi_question_text':'some text question',
                'en_question_text':'some text question'
            },
            'difficulty': 'Medium',  // from the choices= ['Medium', 'Hard', 'Easy']
            'topic': 'Topic 1',   // from the choices= ['Topic 1','Topic 2','Topic 3','Topic 4']
            'type': 'MQC', // from the choice= ['MQC', 'Integer Answer']
            'answer': answer, // answer for the question can contain both Interger Value or the Option Name

            // option will be only there when type == 'MQC'
            'option':{
                'option1':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option2':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option3':{
                    'en_text':'something',
                    'hi_text':'something'
                },
                'option4':{
                    'en_text':'something',
                    'hi_text':'something'
                }

            }

        }

        return [
            question,
            .
            .
            .
            .
            question
        ]
    '''
    question_list = []
    questions = Questions.query.all()
    for question in questions:
        question_data = get_question_as_dict(question)
        question_list.append(question_data)
    return question_list
