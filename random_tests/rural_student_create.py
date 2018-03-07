import datetime
from app.models import Student, Qualification, SchoolInstructionMedium, FamilyType, Class12Stream, UrbanOrRural, FamilyHead, UrbanProfessions, RuralProfessions, RuralOrgMembership, HousingType, Caste
from app import db, app

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
student.urban_rural = UrbanOrRural.rural

# common privilege check
student.family_head = FamilyHead.father
student.family_head_qualification = Qualification.class_5_pass
student.fam_members = 10
student.earning_fam_members = 2
student.monthly_family_income = 10000

# rural check
student.rural_family_head_prof = RuralProfessions.unemployed
student.family_head_org_membership = RuralOrgMembership.nothing
student.family_type = FamilyType.single
student.family_land_holding = 10
student.family_draught_animals = 10
student.housing_type = HousingType.hut
student.items_owned = []

# other
student.enrolment_id = 1

db.session.add(student)
db.session.commit()

# rendering the template
template = "app/templates/zoho/enrolled.xml"
rendered = render(template, {
    'student': student,
    'stage': 'Entrance Test',
    'results_}url': 'Results URL',
    'test_version': app.config['TEST_VERSION'],
    'test_score': 12
})
print(rendered)