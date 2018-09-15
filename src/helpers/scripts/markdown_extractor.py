import mistune, json, bs4, os, requests

from pprint import pprint
from chanakya import ROOT_DIR

from chanakya.src.helpers.file_uploader import upload_file_to_s3

DEBUG = True

MAIN_URL = 'http://127.0.0.1:5000/questions/'

markdown = mistune.Markdown()
HEADERS = {'content-type': 'application/json'}

QUESTION_DIRECTORY = os.path.join(ROOT_DIR, 'questions') + '/'

FILE_CONTENT_TYPES = {
	# these will be used to set the content type of S3 object. It is binary by default.
	'jpg': 'image/jpeg',
	'jpeg': 'image/jpeg',
	'png': 'image/png',
	'pdf': 'application/pdf',
	'gif': 'image/gif'
}

difficulty = {
	'easy': 'Easy',
	'medium': 'Medium',
	'hard': 'Hard'
}

question_type = {
	'mcq' : 'MCQ',
	'integer_answer' : 'Integer Answer'
}


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
		data['type'] = question_type[data['type']]
		data['topic'] = 'Topic 1' if DEBUG else data['category'] # Turn off DEBUG when enums are updated
		data['difficulty'] = difficulty[data['difficulty_level']]

		del data['difficulty_level']
		del data['category']

		return data

	def get_question_html(self, text):
		'''
			updating the images src with the s3 uploaded image links so it can be extracted easily
			and then changing the whole md text to html format so it can be added to database.
			params: md text

			return html_soup as string

		'''
		html_string = markdown(text)
		soup = bs4.BeautifulSoup(html_string, 'html.parser')
		images = soup.find_all('img')

		if images:
			# update each image with s3 url
			for image in images:
				image_path = image.attrs['src']
				s3_url = self.upload_image(image_path)
				image.attrs.update({'src':s3_url, 'class': 'center-image'})

		return str(soup)

	def question_extractor(self):
		'''
			extracting both the question choices as a dict file which can be sent to the api
			/questions/ or /questions/<question_id>

		'''
		choice_1 ,  choice_2 = {}, {}
		# extracting question mcq as based on format
		if self.extra_data['type'] == 'MCQ':

			# index of hindi mcq question choice 1
			start_hindi_1 = self.file_data.find('Hindi') + 6
			end_hindi_1 = self.file_data.find('Options') - 4

			# index of english mcq question choice 1
			start_english_1 = self.file_data.find('English') + 8
			end_english_1 = self.file_data.find('Question Choice 2') - 2

			# index of hindi mcq question choice 2
			start_hindi_2 = self.file_data.rindex('Hindi') + 6
			end_hindi_2 = self.file_data.rindex('Options') - 4

			# index of english mcq question choice 2
			start_english_2 = self.file_data.rindex('English') + 8

			# getting the html_string format of the md text with updated images src to s3 url
			# question_choice 1
			choice_1['hi_text'] = self.get_question_html(self.file_data[start_hindi_1:end_hindi_1])
			choice_1['en_text'] = self.get_question_html(self.file_data[start_english_1:end_english_1])
			
			# question_choice 2
			choice_2['hi_text'] = self.get_question_html(self.file_data[start_hindi_2:end_hindi_2])
			choice_2['en_text'] = self.get_question_html(self.file_data[start_english_2:])


		else:
			# index of hindi integer question choice 1
			start_hindi_1 = self.file_data.find('Hindi') + 6
			end_hindi_1 = self.file_data.find('English') - 3

			# index of english integer question choice 1
			start_english_1 = self.file_data.find('English') + 8
			end_english_1 = self.file_data.find('Question Choice 2') - 2

			# index of hindi integer question choice 2
			start_hindi_2 = self.file_data.rindex('Hindi') + 6
			end_hindi_2 = self.file_data.rindex('English') - 3

			# index of english integer question choice 2
			start_english_2 = self.file_data.rindex('English') + 8

			# getting the html_string format of the md text with updated images src to s3 url
			# question_choice 1
			choice_1['hi_text'] = self.get_question_html(self.file_data[start_hindi_1:end_hindi_1])
			choice_1['en_text'] = self.get_question_html(self.file_data[start_english_1:end_english_1])
			# question_choice 2
			choice_2['hi_text'] = self.get_question_html(self.file_data[start_hindi_2:end_hindi_2])
			choice_2['en_text'] = self.get_question_html(self.file_data[start_english_2:])


		option_1, option_2 = self.options_extractor()

		choice_1['options'] = option_1
		choice_2['options'] = option_2

		# updating the choice with the extra options like type, topic, difficulty
		choice_1.update(self.extra_data)
		choice_2.update(self.extra_data)

		self.questions.append(choice_1)
		self.questions.append(choice_2)



	def options_extractor(self):
		'''
			options extractor return a list of options that is being extracted
			as per the api requires
		'''

		code_soup = self.soup.find_all('code')

		if self.extra_data['type'] == 'MCQ':
			tables = self.soup.find_all('table') # contains both the options

			option_1 = self.mcq_extractor(tables[0], code_soup[1]) #options for question choice 1
			option_2 = self.mcq_extractor(tables[1], code_soup[2]) #options for question choice 2

		else:
			option_1 = self.integer_extractor(code_soup[1]) #options for question choice 1
			option_2 = self.integer_extractor(code_soup[2]) #options for question choice 2

		return option_1, option_2


	def mcq_extractor(self, table, code_soup):
		# extract all the soup of the td options
		tds = [tr.find_all('td')[1] for tr in table.find_all('tr')[1:] ]
		#extract the id of the options sequential wise

		option_ids = [tr.find_all('td')[2].text for tr in table.find_all('tr')[1:]]
		options = []

		# creating option to dump the database
		for index, td in enumerate(tds):
			option = {}

			# updating all the image src with s3 url if the options has any image
			option_images = td.find_all('img')
			if option_images:
				for image in option_images:
					s3_image_url = self.upload_image(image.get('src'))
					image.attrs.update({'src': s3_image_url})

			# adding id of the options if exist
			if option_ids[index] != 'NULL':
				option['id'] = int(option_ids[index])

			option['hi_text'] = str(td)
			option['en_text'] = str(td)
			option['correct'] = False
			options.append(option)

		# questionsMetaChoiceData
		meta_choice_data = json.loads(code_soup.text)
		answer_index = meta_choice_data['Correct Answer']

		# saving the options which is correct
		options[int(answer_index)-1]['correct'] = True

		return options

	def integer_extractor(self, code_soup):
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

	def add_to_db(self):
		codes = self.soup.find_all('code')

		# getting both the question on the way to api
		for i, question in enumerate(self.questions):
			code = json.loads(codes[i+1].text)

			question_id = code['Question ID']

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
				pprint(resp)

		#updating the md text file with the changes made
		with open(self.file_path, 'w') as f:
			f.write(self.file_data)
			f.close()
			print('Data Added! for file : \n', self.file_path)


	def upload_image(self, image_path):
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
		# s3_url = upload_file_to_s3(file = image_data, filename= image_data.name)

		return s3_url

files = [file for file in os.listdir(QUESTION_DIRECTORY) if file.endswith('.md')]
files.remove('README.md')

for file in files:
	pprint(file)
	question = MDQuestionExtractor(file)
	question.question_extractor()
	question.add_to_db()
	print()
	print()
