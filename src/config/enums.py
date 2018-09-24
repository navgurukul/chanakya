import enum

class QuestionDifficulty(enum.Enum):
    easy = 'Easy'
    medium = 'Medium'
    hard = 'Hard'

class QuestionTopic(enum.Enum):
    topic1 = "BASIC_MATH"
    topic2 = "ABSTRACT_REASONING"
    topic3 = "NON_VERBAL_LOGICAL_REASONING"

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
    enrolment_key_gen = 'Enrollment Key Generated'
    alg_interview_pass = 'Algebra Interview Passed'
    alg_interview_fail = 'Algebra Interview Failed'
    other = 'Other'

class Caste(enum.Enum):
    sc = "SC (Scheduled Caste)"
    st = "ST (Scheduled Tribe)"
    obc = "OBC (Other Backward Classes)"
    general = "General"
    other = "Others"

class Religion(enum.Enum):
    hindu = 'Hindu'
    muslim = 'Muslim'
    christian = 'Christian'
    jain = 'Jain'
