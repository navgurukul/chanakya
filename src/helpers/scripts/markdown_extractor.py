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
        """
        	Extracting the question data like category, type , difficulty formatting it in a dictionary which is required in the chanakya question CREATE and UPDATE payload.
            Return dictionary which look like below.
            {
                'type': 'MCQ'
                'topic': 'BASIC_MATH'
                'difficulty': 'Easy'
            }
        """
        data = json.loads(self.soup.find('code').text)
        # rearranging the data to right fields
        data['type'] = QUESTION_TYPE[data['type']]
        data['topic'] = data['category']
        data['difficulty'] =  QUESTION_DIFFICULTY[data['difficulty_level']]

        del data['difficulty_level']
        del data['category']

        return data

    def update_question_images_from_string(self, html_string):
        """
            Helps to update the images that are present in question common text with s3 link.

            Params:
                `html_string` : Contains the string formatted html of questions Common Text.

            Return: Contains the string formatted html of questions Common Text with updated s3 link.
        """
        soup = bs4.BeautifulSoup(html_string, 'html.parser')
        images = soup.find_all('img')
        self.update_images_with_s3_url(images, 'center-image')
        return str(soup)

    def update_images_with_s3_url(self, images, image_class):
        """
            Helps to update all the images provided in a `images` list with s3 link and CSS class for the images.
            Params:
                `images` : Contains list of images soup that need updated s3 link in 'src'.
                `image_class` : CSS class of the images in html that need to be added.
        """

        if images:
            # update each image with s3 url
            for image in images:
                image_path = image.attrs['src']
                s3_url = upload_image(image_path)
                image.attrs.update({'src':s3_url, 'class': image_class})


    def get_soup_in_between(self, start_soup, end_soup=None):
        """
            Helps to get all the question data which is in html as string between 2 points.
            Params:
                `start_soup` : Contains the point from where string need to be extracted.
                `end_soup` : Contains the point till where string need to be extracted.

            Return:
                html_string which is in between start_soup and end_soup point.

            For Example:
                <h1>Hindi</h1>
                <p>Some data in hindi</p>
                <p>Some extra data in Hindi</p>
                <h1>English</h1>

                The functions helps to extract data below for question hi_text.
                "<p>Some data in hindi</p>\n<p>Some extra data in Hindi</p>"
        """
        if not start_soup:
            return ''
        soup =  start_soup.find_next_sibling()
        if soup == end_soup:
            return ''
        return str(soup) + '\n' + self.get_soup_in_between(soup, end_soup)


    def question_extractor(self):
        """
        	Extract the question and saves it to self.questions list
            so it can be updated to chanakya.
        """

        choice_1, choice_2 = {}, {}
        question_soup = [s for s in self.soup.find_all('h2')]
        print(question_soup)


        if self.extra_data['type'] == 'MCQ':

            common_text_1 = self.get_soup_in_between(question_soup[0], question_soup[1])
            hi_text_1 = self.get_soup_in_between(question_soup[1], question_soup[2])

            option_tag = self.soup.find('h3') # <h3>Options</h3>

            # when there is ### Options
            if option_tag:
                en_text_1 = self.get_soup_in_between(question_soup[2], option_tag)
                common_text_2 = self.get_soup_in_between(question_soup[3], question_soup[4])
                hi_text_2 = self.get_soup_in_between(question_soup[4], question_soup[5])
                en_text_2 = self.get_soup_in_between(question_soup[5], option_tag)

            # when there is no ## Common Options
            else:
                en_text_1 = self.get_soup_in_between(question_soup[2], question_soup[3])
                common_text_2 = self.get_soup_in_between(question_soup[4], question_soup[5])
                hi_text_2 = self.get_soup_in_between(question_soup[5], question_soup[6])
                en_text_2 = self.get_soup_in_between(question_soup[6], question_soup[7])

        else:
            # For Integer answer type question
            question_2_tag = self.soup.find_all('h1')[1] # <h1>Question Choice 2</h1>

            common_text_1 = self.get_soup_in_between(question_soup[0], question_soup[1])
            hi_text_1 = self.get_soup_in_between(question_soup[1], question_soup[2])
            en_text_1 = self.get_soup_in_between(question_soup[2], question_2_tag)

            common_text_2 = self.get_soup_in_between(question_soup[3], question_soup[4])
            hi_text_2 = self.get_soup_in_between(question_soup[4], question_soup[5])
            en_text_2 = self.get_soup_in_between(question_soup[5], None)

        option_1, option_2 = self.options_extractor()

        choice_1['hi_text'] = hi_text_1
        choice_1['en_text'] = en_text_1
        choice_1['options'] = option_1

        choice_2['hi_text'] = hi_text_2
        choice_2['en_text'] = en_text_2
        choice_2['options'] = option_2

        #updating question src with new s3 link and center-image class
        choice_1['common_text'] = self.update_question_images_from_string(common_text_1)
        choice_2['common_text'] = self.update_question_images_from_string(common_text_2)

        choice_1.update(self.extra_data)
        choice_2.update(self.extra_data)

        self.questions.append(choice_1)
        self.questions.append(choice_2)


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

						   *Note: if we update the question with new option this is how the new option looks like *
                          {'correct': False,
                           'en_text': '<td style="text-align:left">25ml black, '
                                      '16ml white</td>',
                           'hi_text': '<td style="text-align:left">25ml black, '
                                      '16ml white</td>'}]
        '''
        option_tag = self.soup.find('h3')

        # when there is language specific optons
        if option_tag:
            # extract all the soup of the td options
            en_options = [tr.find_all('td')[1] for tr in table.find_all('tr')[1:]]
            hi_options = [tr.find_all('td')[2] for tr in table.find_all('tr')[1:]]

            # extract the id of the options sequential wise
            option_ids = [tr.find_all('td')[3].text for tr in table.find_all('tr')[1:]]

            option_col = en_options
        # when there is common options
        else:
            # extract all the soup of the td options
            option_col = [tr.find_all('td')[1] for tr in table.find_all('tr')[1:]]
            # extract the id of the options sequential wise
            option_ids = [tr.find_all('td')[2].text for tr in table.find_all('tr')[1:]]

        options = []

        # creating option to dump the database
        for index in range(len(option_col)):
            option = {}

            # when there are english and hindi options
            if option_tag:
                option_images = en_options[index].find_all('img')
                option_images.extend(hi_options[index].find_all('img'))
            else:
                option_images = option_col[index].find_all('img')


            # updating all the image src with s3 url if the options has any image
            self.update_images_with_s3_url(option_images, 'option-image')


            # adding id of the options if exist
            if option_ids[index] != 'NULL':
                option['id'] = int(option_ids[index])

            # language specific options
            if option_tag:
                option['en_text'] = str(en_options[index])
                option['hi_text'] = str(hi_options[index])
            # common options
            else:
                option['en_text'] = str(option_col[index])
                option['hi_text'] = str(option_col[index])

            option['correct'] = False
            options.append(option)

        # questionsMetaChoiceData
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

            Calls the API
                /questions/ to create a new question
                /question/<question_id> to update a new question

            Update part also creates a new options in the database for MCQ you just need to add it to the md file
            in the same format.

            return Nothing
        '''
        codes = self.soup.find_all('code')

        # getting both the question on the way to api
        for i, question in enumerate(self.questions):

            # details about the question
            question_info = json.loads(codes[i+1].text)

            question_id = question_info['Question ID']

            # create question and update Question ID
            if question_id == 'NOT_ADDED':
                # adding question through rest
                resp = requests.post(MAIN_URL, data=json.dumps(question), headers=HEADERS).json()
                pprint(resp)

                # getting the id after the question has been added
                id = resp['id']
                # updating the question id in the md text file
                self.file_data = self.file_data.replace('NOT_ADDED', str(id), 1)

                # updating the options with the id
                options = resp['options']
                question_type = resp['type']

                for option in options:
                    id = option['id']
                    # updating the table for mcq question
                    if question_type == 'MCQ':
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

                #updating the new options
                question_type = resp['question']['type']
                if question_type == 'MCQ':
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
