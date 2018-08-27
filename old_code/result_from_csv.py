import csv

QUESTIONS = [
    {
        'serial': 1,
        'level': 'easy',
        'answer': '8'
    },
    {
        'serial': 2,
        'level': 'medium',
        'answer': '-21'
    },
    {
        'serial': 3,
        'level': 'hard',
        'answer': '1'
    },
    {
        'serial': 4,
        'level': 'easy',
        'answer': '3'
    },
    {
        'serial': 5,
        'level': 'medium',
        'answer': '4'
    },
    {
        'serial': 6,
        'level': 'hard',
        'answer': 'D'
    },
    {
        'serial': 7,
        'level': 'easy',
        'answer': 'B'
    },
    {
        'serial': 8,
        'level': 'medium',
        'answer': 'A'
    },
    {
        'serial': 9,
        'level': 'hard',
        'answer': 'C'
    },
    {
        'serial': 10,
        'level': 'easy',
        'answer': 'B'
    },
    {
        'serial': 11,
        'level': 'medium',
        'answer': 'C'
    },
    {
        'serial': 12,
        'level': 'hard',
        'answer': 'A'
    },
    {
        'serial': 13,
        'level': 'easy',
        'answer': 'E'
    },
    {
        'serial': 14,
        'level': 'medium',
        'answer': 'C'
    },
    {
        'serial': 15,
        'level': 'hard',
        'answer': 'B'
    },
    {
        'serial': 16,
        'level': 'easy',
        'answer': 'A'
    },
    {
        'serial': 17,
        'level': 'medium',
        'answer': '216'
    },
    {
        'serial': 18,
        'level': 'hard',
        'answer': 'C'
    },
]

MARKING = {
    'easy': 1,
    'medium': 2,
    'hard': 3
}

# compiling the answers
scores = []
file = open('test.csv')
answers_csv = csv.DictReader(file)
answers = []
for student in answers_csv.reader:
    answers.append(student)
answers = answers[1:]

# computing the score
yoyos = []
for student in answers:
    score = 0
    yoyo = []
    for i in range(len(student)):
        if QUESTIONS[i]['answer'] == student[i]:
            yoyo.append(True)
            score += MARKING[ QUESTIONS[i]['level'] ]
        else:
            yoyo.append(False)
    yoyos.append(yoyo)
    scores.append(score)