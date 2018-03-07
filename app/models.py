from app import db
import datetime
from enum import Enum

INDIAN_STATES = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli',
    'Daman and Diu',
    'National Capital Territory of Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal'
]

ITEMS_OWNED_MAPPING = {
    'bullock_cart': 'Bullock Cart',
    'cycle': 'Cycle',
    'radio': 'Radio',
    'chairs': 'Chairs',
    'mobile': 'Mobile Phones',
    'television': 'Television',
    'refirgerator': 'Refrigerator'
}

class Qualification(Enum):
    no_reading_writing = 1 # Don't know how to read or write
    reading_writing = 2 # Know how to read or write
    class_5_pass = 3 # Class 5 pass
    class_8_pass = 4 # Class 8 pass
    class_10_pass = 5 # Class 10 pass
    class_12_pass = 6 # Class 12 pass
    graduate = 7 # Graduation completed
    post_graduation = 8 # Post graduation
    prof_degree = 9 # Professional degree

class SchoolInstructionMedium(Enum):
    english = 1 # "English"
    other = 2 # "Non English"

class Class12Stream(Enum):
    pcm = 1 # "Non Medical (Phy, Chem, Maths)"
    pcb = 2 # "Medical (Phy, Chem, Biiteo)"
    pcmb = 3 # "Combined (Phy, Chem, Bio, Maths)"
    commerce_with_maths = 4 # "Commerce (with maths)"
    commerce_without_maths = 5 # "Commerce (without maths)"
    arts = 6 # "Arts"
    others = 7 # "Others"

class UrbanOrRural(Enum):
    urban = 1 # "Sheher"
    rural = 2 # "Gaon"

class FamilyHead(Enum):
    father = 1 # "Papa"
    mother = 2 # "Mummy"
    other = 3 # "Others"

class UrbanProfessions(Enum):
    unemployed = 1 # Unemployed
    no_training_jobs = 2 # Servant / Peon etc. (jobs without training)
    jobs_with_training = 3 # Factory worker etc. (jobs requiring some training)
    high_training = 4 # Driver etc. which require higher training
    read_write_jobs = 5 # Clerk etc which require how to read or write
    routine_work = 6 # Lecturers , High School teachers etc.
    prof_degree_work = 7 # doctors etc.

class RuralProfessions(Enum):
    unemployed = 1 # Unemployed
    labourer = 2 # Labourer
    caste_related_work = 3
    business = 4
    independent_work = 5 
    work_on_own_land = 6
    service = 7

class RuralOrgMembership(Enum):
    nothing = 1
    member_1_org = 2 # member of only one org
    member_1plus_org = 3 # member of 1 or more orgs
    office_holder = 4 # office holde of an org
    pub_leader = 5 # public leader 

class FamilyType(Enum):
    single = 1
    joint = 2

class HousingType(Enum):
    hut = 1 # hut / jhopri
    kacha_house = 2
    pucca_house = 3 
    kothi = 4

class Difficulty(Enum):
    easy   = 1
    medium = 2
    hard   = 3

class QuestionType(Enum):
    MCQ          = 1
    short_answer = 2
    view         = 3

class Boolean(Enum):
    yes = "Yes"
    no  = "No"

class Gender(Enum):
    male   = "Male"
    female = "Female"
    others = "Transgender"

class Caste(Enum):
    sc = "(SC) Scheduled Caste"
    st = "(ST) Scheduled Tribe"
    obc = "(OBC) Other Backward Classes"
    general = "General"
    other = "Others"

class Enrolment(db.Model):
    __tablename__    = "enrolment"
    id               = db.Column(db.Integer, primary_key=True)
    enrolment_key    = db.Column(db.String(5), index=True, unique=True)
    phone_number     = db.Column(db.String(10), index=True)
    crm_potential_id = db.Column(db.String(20))
    created_on       = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    test_data        = db.relationship("TestData")

    def __repr__(self):
        return '<Enrolment: %s, Phone number: %d>' %(self.enrolment_key, self.phone_number) 

class TestData(db.Model):
    __tablename__      = "test_data"
    id                 = db.Column(db.Integer, primary_key=True)
    started_on         = db.Column(db.DateTime, nullable=False)
    submitted_on       = db.Column(db.DateTime, nullable=False)
    received_marks     = db.Column(db.Integer, nullable=False)
    max_possible_marks = db.Column(db.Integer, nullable=False)
    set_name           = db.Column(db.String(32), nullable=False)
    enrolment_id       = db.Column(db.Integer, db.ForeignKey("enrolment.id"))
    #enrolment          = db.relationship("Enrolment")

class Options(db.Model):
    __tablename__    = "options"
    id               = db.Column(db.Integer, primary_key=True)
    option_1         = db.Column(db.String(128)) #this is the answer
    option_2         = db.Column(db.String(128))
    option_3         = db.Column(db.String(128))
    option_4         = db.Column(db.String(128))

class Question(db.Model):
    __tablename__      = "question"
    id                 = db.Column(db.Integer, primary_key=True)
    en_question_text   = db.Column(db.String(1024), nullable=False)
    hi_question_text   = db.Column(db.String(1024), nullable=False)
    difficulty         = db.Column(db.Enum(Difficulty), nullable=False)
    category           = db.Column(db.String(32), nullable=False)
    question_type      = db.Column(db.Enum(QuestionType), nullable=False)
    options_id         = db.Column(db.Integer, db.ForeignKey("options.id"))
    options            = db.relationship("Options", backref=db.backref("options", uselist=False))

    def __repr__(self):
        return '<Question: %s>' %(self.en_question_text) 

class Student(db.Model):
    __tablename__   = "student"
 
    # id
    id = db.Column(db.Integer, primary_key=True)
    
    # basic details of the student
    name = db.Column(db.String(100), nullable=False)
    gender = db.Column(db.Enum(Gender), nullable=False)
    mobile  = db.Column(db.String(10), nullable=False)
    dob = db.Column(db.Date, nullable=False)

    # academic details
    school_medium = db.Column(db.String(10), nullable=True)
    qualification = db.Column(db.Enum(Qualification), nullable=False)
    class_10_marks = db.Column(db.String(10), nullable=True) # should at least be a 10th pass
    class_12_marks = db.Column(db.String(10), nullable=True) # should at least be a 12th pass
    class_12_stream = db.Column(db.Enum(Class12Stream), nullable=True) # should at least be a 12th pass
    
    # location details
    pin_code = db.Column(db.String(6), nullable=True)
    state = db.Column(db.Enum(*INDIAN_STATES), nullable=False)
    district = db.Column(db.String(100), nullable=True)
    tehsil = db.Column(db.String(100), nullable=True)
    city_or_village = db.Column(db.String(100), nullable=True)

    # caste / jaati etc.
    caste_parent_category = db.Column(db.Enum(Caste), nullable=False)
    caste = db.Column(db.String(100))

    # urban or rural
    urban_rural = db.Column(db.Enum(UrbanOrRural), nullable=False)

    # common fields (to both urban & rural) for privilege check
    family_head = db.Column(db.Enum(FamilyHead))
    family_head_other = db.Column(db.String(100)) # only when `family_head` value is other
    family_head_qualification = db.Column(db.Enum(Qualification))    
    fam_members = db.Column(db.Integer)
    earning_fam_members = db.Column(db.Integer)
    monthly_family_income = db.Column(db.Integer)

    # urban privilege check
    urban_family_head_prof = db.Column(db.Enum(UrbanProfessions))
    family_head_income = db.Column(db.Integer)

    # rural privilege check 
    rural_family_head_prof = db.Column(db.Enum(RuralProfessions))
    family_head_org_membership = db.Column(db.Enum(RuralOrgMembership))
    family_type = db.Column(db.Enum(FamilyType))
    family_land_holding = db.Column(db.Integer)
    family_draught_animals = db.Column(db.Integer)
    housing_type = db.Column(db.Enum(HousingType))
    owned_items = db.Column(db.String(1000))

    # system related stuff
    created_on   = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    enrolment_id = db.Column(db.Integer, db.ForeignKey("enrolment.id"))
    enrolment    = db.relationship("Enrolment", backref=db.backref("s_enrolment", uselist=False))
    test_data_id = db.Column(db.Integer, db.ForeignKey("test_data.id"))
    test_data    = db.relationship("TestData", backref=db.backref("test_data", uselist=False))

    @property
    def items_owned(self):
        items = self.owned_items.split(',')
        items = [item.strip() for item in items]
        items = [ITEMS_OWNED_MAPPING[item] for item in items]
        return items
    
    @items_owned.setter
    def items_owned(self, value):
        if type(value) is not list:
            raise Exception("The type of items is not a list.")
        for item in items:
            if not ITEMS_OWNED_MAPPING.get(item):
                raise Exception("The list of owned items being set has an unreconized item.")
            else:
                pass
        items = ','.join(value)
        self._items_owned = items
        self.owned_items = items
        