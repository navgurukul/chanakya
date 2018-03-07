import datetime
from app.models import Student, Qualification, SchoolInstructionMedium, Class12Stream, UrbanOrRural, FamilyHead, UrbanProfessions, RuralProfessions, RuralProfessions, HousingType, Caste
from app import db, app
from app.crm_api import render

student = Student()

# basics
student.name = "Rishabh Verma"
student.gender = "Male"
student.mobile = "8130378953"
student.dob = datetime.date(1995,2,5)

# academic details
student.school_medium = SchoolInstructionMedium.english
student.qualification = Qualification.class_10_pass
student.class_10_marks = "4.5"
student.class_12_marks = 97
student.class_12_stream = Class12Stream.pcm

# location details
student.pin_code = "120018"
student.state = "Haryana"
student.district = "Panchkula"
student.tehsil = "Panchkula"
student.city_or_village = "Panchkula"

# caste / jaati
student.caste_parent_category = Caste.general
student.jaati = "Kshatriya"

# Urban or Rural
student.urban_rural = UrbanOrRural.urban

# common privilege check
student.family_head = FamilyHead.father
student.family_head_qualification = Qualification.class_5_pass
student.fam_members = 10
student.earning_fam_members = 2
student.monthly_family_income = 10000

# urban check
student.urban_family_head_prof = UrbanProfessions.unemployed
student.family_head_income = "10"

# other
student.enrolment_id = 1

db.session.add(student)
db.session.commit()

# rendering the template
template = "app/templates/zoho/enrolled.xml"
rendered = render(template, {
    'student': student,
    'stage': 'Entrance Test',
    'results_url': 'Results URL',
    'test_version': app.config['TEST_VERSION'],
    'test_score': 12
})
print(rendered)