import mistune, json, bs4, os
from chanakya.src.models import Questions
from chanakya import BASE_DIR
from chanakya.src.helpers.file_uploader import upload_file_to_s3

markdown = mistune.Markdown()

question_dir = os.path.join(BASE_DIR, 'questions') + '/'

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
		self.file_path = question_dir + file
		self.file_data = open(self.file_path).read()
		self.file_html = markdown(self.file_data)
		self.soup = bs4.BeautifulSoup(self.file_html, 'html.parser')
		self.questions = []

		self.extra_data = self.question_extra_data()

	def question_extra_data(self):
		data = json.loads(self.soup.find('code').text)
		data['type'] = question_type[data['type']]
		data['topic'] = data['category']
		data['difficulty'] = difficulty[data['difficulty_level']]

		del data['difficulty_level']
		del data['category']

		return data

	def get_question_html(self, text):
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
		choice_1 ,  choice_2 = {}, {}
		if self.extra_data['type'] == 'MCQ':

			start_hindi_1 = self.file_data.find('Hindi') + 6
			end_hindi_1 = self.file_data.find('Options') - 4
			start_english_1 = self.file_data.find('English') + 8
			end_english_1 = self.file_data.find('Question Choice 2') - 2

			start_hindi_2 = self.file_data.rindex('Hindi') + 6
			end_hindi_2 = self.file_data.rindex('Options') - 4
			start_english_2 = self.file_data.rindex('English') + 8

			choice_1['hi_text'] = self.get_question_html(self.file_data[start_hindi_1:end_hindi_1])
			choice_1['en_text'] = self.get_question_html(self.file_data[start_english_1:end_english_1])
			choice_2['hi_text'] = self.get_question_html(self.file_data[start_hindi_2:end_hindi_2])
			choice_2['en_text'] = self.get_question_html(self.file_data[start_english_2:])


		else:

			start_hindi_1 = self.file_data.find('Hindi') + 6
			end_hindi_1 = self.file_data.find('English') - 3
			start_english_1 = self.file_data.find('English') + 8
			end_english_1 = self.file_data.find('Question Choice 2') - 2

			start_hindi_2 = self.file_data.rindex('Hindi') + 6
			end_hindi_2 = self.file_data.rindex('English') - 3
			start_english_2 = self.file_data.rindex('English') + 8

			choice_1['hi_text'] = self.get_question_html(self.file_data[start_hindi_1:end_hindi_1])
			choice_1['en_text'] = self.get_question_html(self.file_data[start_english_1:end_english_1])
			choice_2['hi_text'] = self.get_question_html(self.file_data[start_hindi_2:end_hindi_2])
			choice_2['en_text'] = self.get_question_html(self.file_data[start_english_2:])


		option_1, option_2 = self.options_extractor()
		choice_1['options'] = option_1
		choice_2['options'] = option_2

		choice_1.update(self.extra_data)
		choice_2.update(self.extra_data)

		self.questions.append(choice_1)
		self.questions.append(choice_2)


	def options_extractor(self):
		code_soup = self.soup.find_all('code')
		if self.extra_data['type'] == 'MCQ':
			tables = self.soup.find_all('table')
			option_1 = self.mcq_extractor(tables[0], code_soup[1])
			option_2 = self.mcq_extractor(tables[1], code_soup[2])

		else:
			option_1 = self.integer_extractor(code_soup[1])
			option_2 = self.integer_extractor(code_soup[2])

		return option_1, option_2


	def mcq_extractor(self, table, code_soup):
		tds = [ td for i , td in enumerate(table.find_all('td')) if i%2 != 0 ]
		options = []
		for td in tds:
			option = {}
			option_images = td.find_all('img')
			if option_images:
				for image in option_images:
					s3_image_url = self.upload_image(image.get('src'))
					image.attrs.update({'src': s3_image_url})
			option['hi_text'] = str(td)
			option['en_text'] = str(td)
			option['correct'] = False
			options.append(option)

		meta_choice_data = json.loads(code_soup.text)
		answer_index = meta_choice_data['Correct Answer']

		options[int(answer_index)-1]['correct'] = True

		return options

	def integer_extractor(self, code_soup):
		meta_choice_data = json.loads(code_soup.text)
		answer = meta_choice_data['Correct Answer']
		option = {}
		option['en_text'] = answer
		option['hi_text'] = answer
		option['correct'] = True
		options = [option]

		return options

	def add_to_db(self):
		codes = self.soup.find_all('code')
		for i, question in enumerate(self.questions):

			code = json.loads(codes[i+1].text)
			question_id = code['Question ID']
			if question_id == 'NOT_ADDED':
				# create question and update question id
				question_instance = Questions.create_question(question)
				self.file_data = self.file_data.replace('NOT_ADDED', str(question_instance.id), 1)
			else:
				# just update the question
				question_instance = Questions.query.get(int(question_id))
				question_instance.update_question(question)

		with open(self.file_path, 'w') as f:
			f.write(self.file_data)
			f.close()
			print('Data Added! for file : ', self.file_path)

	def upload_image(self, image_path):
		complete_image_path = question_dir + image_path
		image_data = open(complete_image_path, 'rb')
		s3_url = upload_file_to_s3(file = image_data, filename= image_data.name)
		return s3_url

files = [file for file in os.listdir(question_dir) if file.endswith('.md')]
files.remove('README.md')
from pprint import pprint

for file in files:
	print(file)
	question = MDQuestionExtractor(file)
	question.question_extractor()
	# pprint(question.questions[0])
	# print('********************************************')
	# pprint(question.questions[1])
	# print('********************************************')

	question.add_to_db()
	print()
	print()
