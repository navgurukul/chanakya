import enum

class QuestionDifficulty(enum.Enum):
    easy = 'Easy'
    medium = 'Medium'
    hard = 'Hard'

class QuestionTopic(enum.Enum):
    topic1 = "Topic 1"
    topic2 = "Topic 2"
    topic3 = "Topic 3"
    topic4 = "Topic 4"

class QuestionType(enum.Enum):
    mcq = 'MCQ'
    integer_answer = 'Integer Answer'

class IncomingCallType(enum.Enum):
    rqc = 'RQC' # requested callback
    interested = 'INTERESTED' # interested calls (where the student has not clicked anything on the helpline)
    ekg = 'EKG' # enrollment key generate calls (where the student has not clicked anything on the helpline)

class Gender(enum.Enum):
    male = 'MALE'
    female = 'FEMALE'
    other = 'OTHER'

class OutgoingSMSType(enum.Enum):
    test_fail = 'Entrance Test Failed'
    test_pass = 'Entrance Test Passed'
    enrolment_key_gen = 'Enrolment Key Generated'
    alg_interview_pass = 'Algebra Interview Passed'
    alg_interview_fail = 'Algebra Interview Failed'
    other = 'Other'
