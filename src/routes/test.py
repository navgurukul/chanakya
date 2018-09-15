from flask_restplus import Resource, reqparse, fields
from chanakya.src.models import EnrolmentKey, StudentContact, Student, Questions, QuestionAttempts,QuestionSet
from chanakya.src import api, db, app
from datetime import datetime, timedelta

from chanakya.src.helpers.response_objects import (
                enrollment_key_status,
                enrollment_key_validation,
                question_obj,
                questions_list_obj,
                questions_attempts,
                question_set
            )
from chanakya.src.helpers.file_uploader import upload_pdf_to_s3
from chanakya.src.helpers.validators import check_enrollment_key, check_question_ids, check_question_is_in_set
from chanakya.src.helpers.routes_descriptions import (
                VALIDATE_ENROLMENT_KEY_DESCRIPTION,
                PERSONAL_DETAILS_DESCRIPTION
            )
from chanakya.src.helpers.task_helpers import render_pdf_phantomjs


#Validation for the enrollment key
@api.route('/test/validate_enrolment_key')
class EnrollmentKeyValidtion(Resource):
    get_parser = reqparse.RequestParser()
    get_parser.add_argument('enrollment_key', type=str, required=True, help='The enrolment key you want to validate.')

    @api.marshal_with(enrollment_key_validation)
    @api.doc(parser=get_parser, description=VALIDATE_ENROLMENT_KEY_DESCRIPTION)
    def get(self):
        args = self.get_parser.parse_args()
        enrollment_key = args.get('enrollment_key', None)

        result, enrollment = check_enrollment_key(enrollment_key)
        return result


@api.route('/test/personal_details')
class PersonalDetailSubmit(Resource):
    post_parser = reqparse.RequestParser()
    post_parser.add_argument('enrollment_key', type=str, required=True)
    post_parser.add_argument('name', type=str, required=True)
    post_parser.add_argument('dob', help='DD-MM-YYYY', type=lambda x: datetime.strptime(x, "%d-%m-%Y"), required=True)
    post_parser.add_argument('mobile_number', type=str, required=True)
    post_parser.add_argument('gender', type=str, choices=[ attr.value for attr in app.config['GENDER']], required=True)

    @api.marshal_with(enrollment_key_status)
    @api.expect(post_parser)
    @api.doc(description=PERSONAL_DETAILS_DESCRIPTION)
    def post(self):

        args = self.post_parser.parse_args()
        args['gender'] = app.config['GENDER'](args['gender'])

        mobile_number = args['mobile_number']  # student_contact data
        enrollment_key = args['enrollment_key'] # enrollmentkey

        # check the validity of enrollment key
        result, enrollment = check_enrollment_key(enrollment_key)

        # student record shall be updated only when the key is not used
        if result['valid'] and result['reason'] == 'NOT_USED':
            # updating student data
            student_id = enrollment.student_id
            student = Student.query.filter_by(id=student_id).first()
            student.update_data(args)

            # creating student contact record
            student_contact = StudentContact.create(contact=mobile_number, student_id=student_id)
            return {
                'success':True,
                'enrollment_key_status': result['reason']
            }
        # when the key is used but somehow student went to the this route instead of test
        elif result['valid'] and result['reason'] == 'ALREADY_IN_USED':
            return {
                'success':True,
                'enrollment_key_status': result['reason']
            }
        # when the key is not valid
        return {
            'success':False,
            'enrollment_key_status': result['reason'],
        }



@api.route('/test/start_test')
class TestStart(Resource):
    get_parser = reqparse.RequestParser()
    get_parser.add_argument('enrollment_key', required=True, type=str)

    start_test_response = api.model('start_test',{
        'error':fields.Boolean(default=False),
        'questions':fields.List(fields.Nested(question_obj)),
        'enrollment_key_validation': fields.Boolean(default=True)
    })

    @api.marshal_with(start_test_response)
    @api.doc(parser=get_parser)
    def get(self):
        args = self.get_parser.parse_args()

        # check the enrollment key
        enrollment_key =  args.get('enrollment_key')
        result, enrollment = check_enrollment_key(enrollment_key)

        # if enrollment doesn't exist or expired
        if not result['valid']:
            return {
                'error':True,
                'enrollment_key_validation':False
            }

        elif result['valid'] and result['reason'] == 'ALREADY_IN_USED':
            questions = enrollment.extract_question_from_set()
        else:
            # start the test and send the questions generated randomly
            enrollment.start_test()
            question_set, questions = QuestionSet.create_new_set()
            enrollment.question_set_id = question_set.id
            db.session.add(enrollment)
            db.session.commit()

        return {
            'questions':questions
        }



@api.route('/test/end_test')
class TestEnd(Resource):
    end_test_response =  api.model('end_test_response',{
        'error': fields.Boolean(default=False),
        'enrollment_key_valid': fields.Boolean(default=True),
        'success': fields.Boolean(default=False),
        'invalid_question_ids': fields.List(fields.Integer)
    })

    @api.expect(questions_attempts)
    @api.marshal_with(end_test_response)
    def post(self):

        args = api.payload

        # check the enrollment key
        enrollment_key =  args.get('enrollment_key')
        result, enrollment = check_enrollment_key(enrollment_key)

        # if enrollment doesn't exist or expired
        if not result['valid']:
            return {
                'error':True,
                'enrollment_key_valid':False
            }
        #add questions to db
        questions_attempted = args.get('question_attempted')
        # is_question_ids_correct = check_question_ids(questions_attempted)
        wrong_question_ids = check_question_ids(questions_attempted)

        if wrong_question_ids:
            return {
                'error':True,
                'enrollment_key_valid':True,
                'invalid_question_ids': wrong_question_ids
            }
        wrong_question_ids = check_question_is_in_set(enrollment, questions_attempted)

        # if not question_is_in_set:
        if wrong_question_ids:
            return {
                'error':True,
                'enrollment_key_valid':True,
                'invalid_question_ids': wrong_question_ids
            }

        QuestionAttempts.create_attempts(questions_attempted, enrollment)
        enrollment.end_test()

        enrollment.end_test()

        return {
            'success': True
        }


@api.route('/test/extra_details')
class MoreDetail(Resource):
    def post(self):
        return {
            'data':'All Detail Submitted'
        }



@api.route('/test/offline_paper')
class OfflinePaper(Resource):
    offline_paper_post = api.model('offline_paper_post', {
        'number_sets':fields.Integer(required=True),
        'partner_name':fields.String(required=True)
    })

    sets = api.model('sets', {
            'sets': fields.List(fields.Nested(question_set))
        })

    offline_paper_response = api.model('offline_paper_response', {
        'error': fields.Boolean(default=False),
        'sets':fields.Nested(sets)
    })

    @api.marshal_with(offline_paper_response)
    @api.expect(offline_paper_post)
    def post(self):
        args = api.payload

        number_sets = args.get('number_sets')
        partner_name = args.get('partner_name')

        set_list = []

        for set in range(number_sets):
            try:
                # generate the random sets and get question
                questions_set, questions = QuestionSet.create_new_set(partner_name)

                # render pdf
                pdf = render_pdf_phantomjs('question_pdf.html', **locals())

                #s3 method that upload the binary file
                url = upload_pdf_to_s3(string=pdf)

                # update url of question_set
                question_set.url = url
                db.session.add(questions_set)
                db.session.commit()

                set_list.append(question_set)
            except Exception as e:
                raise e
        # return each and every question_set
        return {
            'sets': set_list
        }

    @api.marshal_with(offline_paper_response)
    def get(self):
        question_set = QuestionSet.query.filter(QuestionSet.partner_name != None).all()
        return {
            'sets': question_set
        }


@api.route('/test/offline_paper/<id>')
class SingleOfflinePaper(Resource):

    single_set = api.model('single_set', {
        'error': fields.Boolean(default=False),
        'set': fields.Nested(question_set)
    })

    @api.marshal_with(single_set)
    def get(self, id):
        question_set = QuestionSet.query.filter_by(id=id).first()
        if question_set:
            return {
                'set': question_set
            }

        return {
            'error': True
        }



@api.route('/test/offline_paper')
class OfflinePaper(Resource):
    offline_paper_post = api.model('offline_paper_post', {
        'number_sets':fields.Integer(required=True),
        'partner_name':fields.String(required=True)
    })

    offline_paper_response = api.model('offline_paper_response', {
        'error': fields.Boolean(default=False),
        'question_sets':fields.List(fields.Nested(question_set))
    })

    @api.marshal_with(offline_paper_response)
    @api.expect(offline_paper_post)
    def post(self):
        args = api.payload

        number_sets = args.get('number_sets')
        partner_name = args.get('partner_name')

        set_list = []

        for i in range(number_sets):
            try:
                # generate the random sets and get question
                questions = Questions.get_random_question_set()
                set = QuestionSet.create_new_set(questions, partner_name)

                # render pdf
                pdf = render_pdf_phantomjs('question_pdf.html', **locals())

                #s3 method that upload the binary file
                url = upload_pdf_to_s3(string=pdf)
                print(url)
                # # update url of question_set
                set.url = url
                db.session.add(set)
                db.session.commit()

                set_list.append(set)
            except Exception as e:
                raise e
        print(set_list)
        # return each and every question_set
        return {
            'question_sets': set_list
        }

    @api.marshal_with(offline_paper_response)
    def get(self):

        question_sets = QuestionSet.query.filter(QuestionSet.partner_name != None).all()
        return {
            'question_sets': question_sets
        }


@api.route('/test/offline_paper/<id>')
class SingleOfflinePaper(Resource):

    single_set = api.model('single_set', {
        'error': fields.Boolean(default=False),
        'message':fields.String,
        'set': fields.Nested(question_set)
    })

    @api.marshal_with(single_set)
    def get(self, id):

        question_set = QuestionSet.query.filter_by(id=id).first()
        if question_set:
            return {
                'set': question_set
            }

        return {
            'error': True,
            'message': "id doesn't exist"
        }
