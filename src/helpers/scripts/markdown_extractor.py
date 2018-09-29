'''
 Take this file outside the chanakya package after that start the server of chanakya
 and then run this file from outside of chanakya

'''

import mistune, json, bs4, os, requests

from pprint import pprint

markdown = mistune.Markdown()

CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))

##### CONFIG #####

SERVER_URL = 'http://127.0.0.1:5000/'

MAIN_URL = SERVER_URL+'questions/'

HEADERS = {'content-type': 'application/json'}

QUESTION_DIRECTORY = os.path.join(CURRENT_DIR, '../../../questions') + '/'

FILE_CONTENT_TYPES = {
	# these will be used to set the content type of S3 object. It is binary by default.
	'jpg': 'image/jpeg',
	'jpeg': 'image/jpeg',
	'png': 'image/png',
	'pdf': 'application/pdf',
	'gif': 'image/gif'
}

QUESTION_DIFFICULTY = {
	'easy': 'Easy',
	'medium': 'Medium',
	'hard': 'Hard'
}
QUESTION_TOPIC = [
    'BASIC_MATH',
    'ABSTRACT_REASONING',
    'NON_VERBAL_LOGICAL_REASONING',
]

QUESTION_TYPE = {
	'mcq' : 'MCQ',
	'integer_answer' : 'Integer Answer'
}


####### helper ########
def upload_image(image_path):
	# getting the image file as binary data to be read
	complete_image_path = QUESTION_DIRECTORY + image_path
	image_data = open(complete_image_path, 'rb')
	file_name = image_path.split('/')[-1]

	filename_extension = file_name.split('.')[-1]
	files = {
	    'image': ('{0}'.format(file_name), image_data, FILE_CONTENT_TYPES[filename_extension]),
	}
	response = requests.post('http://localhost:5000/question/upload_file', files=files)
	print(response.json())
	s3_url = response.json()['image_url']
	# uploading the file to the s3
	return s3_url


###### Question Extractor #######
class MDQuestionExtractor:
    def __init__(self, file):
        self.file_path = QUESTION_DIRECTORY + file
        self.file_data = open(self.file_path).read()
        self.file_html = markdown(self.file_data)
        self.soup = bs4.BeautifulSoup(self.file_html, 'html.parser')
        self.questions = []

        self.extra_data = self.question_extra_data()

    def question_extra_data(self):
        '''
        	extracting the question data like category, type , difficulty and making it to be
        	as dict so it can be added to database.
        '''
        data = json.loads(self.soup.find('code').text)
        # rearranging the data to right fields
        data['type'] = QUESTION_TYPE[data['type']]
        data['topic'] = data['category']
        data['difficulty'] =  QUESTION_DIFFICULTY[data['difficulty_level']]

        del data['difficulty_level']
        del data['category']

        return data

    def update_image(self, soup, image_class):

        images = soup.find_all('img')

        if images:
            # update each image with s3 url
            for image in images:
                image_path = image.attrs['src']
                s3_url = upload_image(image_path)
                image.attrs.update({'src':s3_url, 'class': image_class})


    def get_soup_in_between(self, start_soup, end_soup=None):
        if not start_soup:
            return ''
        soup =  start_soup.find_next_sibling()
        if soup == end_soup:
            return ''
        return str(soup) + '\n' + self.get_soup_in_between(soup, end_soup)


    def question_extractor(self):
        '''
        	extracting both the question choices as a dict file which can be sent to the api
        	/questions/ or /questions/<question_id>

        '''

        choice_1, choice_2 = {}, {}
        question_soup = [s for s in self.soup.find_all('h2')]
        print(question_soup)

        for soup in question_soup:
            if not 'Common Options' in soup.text:
                update_image(soup, 'center-image')

        if self.extra_data['type'] == 'MCQ':

            common_text_1 = self.get_soup_in_between(question_soup[0], question_soup[1])
            hi_text_1 = self.get_soup_in_between(question_soup[1], question_soup[2])
            option_tag = self.soup.find('h3')

            if option_tag:
                en_text_1 = self.get_soup_in_between(question_soup[2], option_tag)
                common_text_2 = self.get_soup_in_between(question_soup[3], question_soup[4])
                hi_text_2 = self.get_soup_in_between(question_soup[4], question_soup[5])
                en_text_2 = self.get_soup_in_between(question_soup[5], option_tag)

            else:
                en_text_1 = self.get_soup_in_between(question_soup[2], question_soup[3])
                common_text_2 = self.get_soup_in_between(question_soup[4], question_soup[5])
                hi_text_2 = self.get_soup_in_between(question_soup[5], question_soup[6])
                en_text_2 = self.get_soup_in_between(question_soup[6], question_soup[7])

        else:
            question_2_tag = self.soup.find_all('h1')[1]

            common_text_1 = self.get_soup_in_between(question_soup[0], question_soup[1])
            hi_text_1 = self.get_soup_in_between(question_soup[1], question_soup[2])
            en_text_1 = self.get_soup_in_between(question_soup[2], question_2_tag)
            common_text_2 = self.get_soup_in_between(question_soup[3], question_soup[4])
            hi_text_2 = self.get_soup_in_between(question_soup[4], question_soup[5])
            en_text_2 = self.get_soup_in_between(question_soup[5], None)

        option_1, option_2 = self.options_extractor()

        choice_1['hi_text'] = hi_text_1
        choice_1['en_text'] = en_text_1
        choice_1['common_text'] = common_text_1
        choice_1['options'] = option_1

        choice_2['hi_text'] = hi_text_2
        choice_2['en_text'] = en_text_2
        choice_2['common_text'] = common_text_2
        choice_2['options'] = option_2

        choice_1.update(self.extra_data)
        choice_2.update(self.extra_data)

        self.questions.append(choice_1)
        self.questions.append(choice_2)

        from pprint import pprint
        pprint(choice_1)
        pprint(choice_2)

    def options_extractor(self):
        '''
            extract options based on mcq or integer_answer
            using mcq_extractor and integer_extractor
            and return options for both the questions choice

            option_1 or option 2 :
                    mcq extractor
                        [{ 'correct': False,
                           'en_text': '<td style="text-align:left">40ml black, '
                        			  '30ml white</td>',
                           'hi_text': '<td style="text-align:left">40ml black, '
                        			  '30ml white</td>',
                           'id': 87},
                          {'correct': False,
                           'en_text': '<td style="text-align:left">30ml black, '
                        			  '20 ml white</td>',
                           'hi_text': '<td style="text-align:left">30ml black, '
                        			  '20 ml white</td>',
                           'id': 88},
                          {'correct': True,
                           'en_text': '<td style="text-align:left">30ml black, '
                        			  '24ml white</td>',
                           'hi_text': '<td style="text-align:left">30ml black, '
                        			  '24ml white</td>',
                           'id': 89}]
                    integer extractor
                          [{'correct': True,
                           'en_text': '<td style="text-align:left">25ml black, '
                        			  '16ml white</td>',
                           'hi_text': '<td style="text-align:left">25ml black, '
                        			  '16ml white</td>'}]

        '''

        code_soup = self.soup.find_all('code')

        if self.extra_data['type'] == 'MCQ':
            tables = self.soup.find_all('table') # contains both the options
            option_1 = self.common_mcq_extractor(tables[0], code_soup[1]) #options for question choice 1
            option_2 = self.common_mcq_extractor(tables[1], code_soup[2]) #options for question choice 2

        else:
            option_1 = self.integer_extractor(code_soup[1]) #options for question choice 1
            option_2 = self.integer_extractor(code_soup[2]) #options for question choice 2

        return option_1, option_2

    def common_mcq_extractor(self, table, code_soup):
        '''
			for extracting the MCQ question option and making it as dictionary format to be uploaded
			the function also heps to update the whole option images if it exist with s3 url and creating option dictionary
			list in which each option has 'id' if it exist else it has no 'id' key

			Marks correct for the correct options

			Params:
				table: BS4 soup format of the options table
				code_soup: carring the details of the question like correct answer

			Return:
						[{ 'correct': False,
                           'en_text': '<td style="text-align:left">40ml black, '
                                      '30ml white</td>',
                           'hi_text': '<td style="text-align:left">40ml black, '
                                      '30ml white</td>',
                           'id': 87},
                          {'correct': False,
                           'en_text': '<td style="text-align:left">30ml black, '
                                      '20 ml white</td>',
                           'hi_text': '<td style="text-align:left">30ml black, '
                                      '20 ml white</td>',
                           'id': 88},
                          {'correct': True,
                           'en_text': '<td style="text-align:left">30ml black, '
                                      '24ml white</td>',
                           'hi_text': '<td style="text-align:left">30ml black, '
                                      '24ml white</td>',
                           'id': 89},

						   #### if we update the question with new option this is how the new option looks like ####
                          {'correct': False,
                           'en_text': '<td style="text-align:left">25ml black, '
                                      '16ml white</td>',
                           'hi_text': '<td style="text-align:left">25ml black, '
                                      '16ml white</td>'}]
        '''
        option_tag = self.soup.find('h3')

        if option_tag:
            # extract all the soup of the td options
            en_options = [tr.find_all('td')[1] for tr in table.find_all('tr')[1:]]
            hi_options = [tr.find_all('td')[2] for tr in table.find_all('tr')[1:]]

            # extract the id of the options sequential wise
            option_ids = [tr.find_all('td')[3].text for tr in table.find_all('tr')[1:]]

            option_col = en_options

        else:
            # extract all the soup of the td options
            option_col = [tr.find_all('td')[1] for tr in table.find_all('tr')[1:]]

            # extract the id of the options sequential wise
            option_ids = [tr.find_all('td')[2].text for tr in table.find_all('tr')[1:]]

        options = []

        # creating option to dump the database
        for index in range(len(option_col)):
            option = {}

            if option_tag:
                option_images = en_options[index].find_all('img')
                option_images.extend(hi_options[index].find_all('img'))
            else:
                option_images = option_col[index].find_all('img')

            # updating all the image src with s3 url if the options has any image
            if option_images:
                for image in option_images:
                    s3_image_url = upload_image(image.get('src'))
                    image.attrs.update({'src': s3_image_url, 'class':'option-image'})

            # adding id of the options if exist
            if option_ids[index] != 'NULL':
                option['id'] = int(option_ids[index])

            if option_tag:
                option['en_text'] = str(en_options[index])
                option['hi_text'] = str(hi_options[index])
            else:
                option['en_text'] = str(option_col[index])
                option['hi_text'] = str(option_col[index])

            option['correct'] = False
            options.append(option)

        # questionsMetaChoiceData
        print(code_soup.text)
        meta_choice_data = json.loads(code_soup.text)
        answer_index = meta_choice_data['Correct Answer']

        # saving the options which is correct
        options[int(answer_index)-1]['correct'] = True

        return options

    def integer_extractor(self, code_soup):
        '''
            it helps to create option dictionary for the integer_answer type question
            since it's single option the correct value will always be True
            params:
                code_soup: which is a soup format data in which it contains correct answer and it's 'Option ID'
                for single option type.

	            return  {
                        'correct': True,
                        'en_text': '<td style="text-align:left">25ml black, '
                        		 '16ml white</td>',
                        'hi_text': '<td style="text-align:left">25ml black, '
                        		 '16ml white</td>',
                        'id': 90
					}
					or for new option
					{
                        'correct': True,
                        'en_text': '<td style="text-align:left">25ml black, '
                        		 '16ml white</td>',
                        'hi_text': '<td style="text-align:left">25ml black, '
                        		 '16ml white</td>'
					}
		'''
        # questionsMetaChoiceData
        meta_choice_data = json.loads(code_soup.text)
        answer = meta_choice_data['Correct Answer']
        id = meta_choice_data['Option ID']

        # extracting the options as the data
        option = {}

        # if options is already added to the db get the id for update
        if id != 'NULL':
            option['id'] = int(id)

        option['en_text'] = str(answer)
        option['hi_text'] = str(answer)
        option['correct'] = True
        options = [option]

        return options

    ############# API CALL PART ##############
    def add_to_db(self):
        '''
            Helps to add or update a question through api and then update the related question markdown files
            with question_id and options_id

            calls the API
                /questions/ to create a new question
                /question/<question_id> to update a new question

            update part also creates a new options in the database for MCQ you just need to add it to the md file
            in the same format.

            return Nothing
        '''
        codes = self.soup.find_all('code')

        # getting both the question on the way to api
        for i, question in enumerate(self.questions):

            # details about the question
            question_info = json.loads(codes[i+1].text)

            question_id = question_info['Question ID']

            if question_id == 'NOT_ADDED':
                # create question and update question id

                # adding question through rest
                resp = requests.post(MAIN_URL, data=json.dumps(question), headers=HEADERS).json()

                pprint(resp)

                # getting the id after the question has been added
                id = resp['id']
                # updating the question id in the md text file
                self.file_data = self.file_data.replace('NOT_ADDED', str(id), 1)

                # updating the options with the id
                options = resp['options']
                type = resp['type']

                for option in options:
                    id = option['id']

                    # updating the table for mcq question
                    if type == 'MCQ':
                        self.file_data = self.file_data.replace('NULL', str(id).ljust(4), 1)
                    # updating the questionsMetaChoiceData for integer option
                    else:
                        self.file_data = self.file_data.replace('NULL', str(id), 1)
            else:
                # just update the question
                question['id'] = int(question_id)

                question_update_url = MAIN_URL +'{}'.format(question_id)

                # sending the question on the way to update itself
                resp = requests.put(question_update_url, data=json.dumps(question), headers=HEADERS).json()

                # finding all the old option ids to check what is the ids of newly added option
                old_option_ids = [option['id'] for option in question['options'] if option.get('id')]

                # response options after updating
                new_options = resp['question']['options']

                type = resp['question']['type']

                #updating the new options

                if type == 'MCQ':
                    for option in new_options:
                        id = option['id']
                        # if the options is newly added
                        if not id in old_option_ids:
                            # updating the table for mcq question
                            self.file_data = self.file_data.replace('NULL', str(id).ljust(4), 1)

                pprint(resp)

        #updating the md text file with the changes made
        with open(self.file_path, 'w') as f:
            f.write(self.file_data)
            f.close()
            print('Data Added! for file : \n', self.file_path)



############## THE Main part #############
# all the md files
files = [file for file in os.listdir(QUESTION_DIRECTORY) if file.endswith('.md')]
files.remove('README.md')

for file in files:
    pprint(file)
    question = MDQuestionExtractor(file)
    question.question_extractor()
    question.add_to_db()
    print()
    print()
