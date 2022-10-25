const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
const Student = require('../models/student');
const EnrolmentKey = require('../models/enrolmentKey');
const Contact = require('../models/studentContact');
const CONSTANTS = require('../constants');

module.exports = [
  {
    method: 'GET',
    path: '/students/{studentId}/request_callback',
    options: {
      description: 'The student with the given ID needs to be called back.',
      tags: ['api'],
      handler: async () => ({ notImplemented: true }),
    },
  },
  {
    method: 'GET',
    path: '/students/{studentId}/send_enrolment_key',
    options: {
      description:
        "Sends the enrolment key to students. Creates one if doesn't exist.",
      tags: ['api'],
      handler: async () => ({ notImplemented: true }),
    },
  },
  {
    method: 'GET',
    path: '/students/status/{mobile}',
    options: {
      description: 'Get students status using existing users mobile number',
      tags: ['api'],
      validate: {
        params: Joi.object({
          mobile: Joi.string().length(10).required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentStatus = await studentService.studentStatus(
          request.params.mobile
        );
        if (studentStatus.length) {
          return { data: studentStatus };
        }
        throw Boom.badRequest(
          'The Mobile number specified is wrong. Please check and try again.'
        );
      },
    },
  },
  {
    method: 'GET',
    path: '/students/Csv',
    options: {
      description: 'get the students data.',
      tags: ['api'],
      validate: {
        query: Joi.object({
          from: Joi.date(),
          to: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        const data = await studentService.studentsData(fromDate, toDate);
        data.results = _.sortBy(data.results, (e) => (
          e.lastTransition !== null ? e.lastTransition.created_at : null
        ));
        if (
          !fromDate
          && !toDate
          && data.results.length <= CONSTANTS.allStudentListSize
        ) {
          return { data: data };
        }

        if (data.results.length <= CONSTANTS.allStudentListSize) {
          return { data: data };
        }
        return {
          data: {
            results: data.results.slice(
              data.results.length - CONSTANTS.allStudentListSize,
              data.results.length
            ),
            ...data,
          },
          message: `Number of rows are more than ${CONSTANTS.allStudentListSize}`,
        };
      },
    },
  },
  {
    method: 'GET',
    path: '/students',
    options: {
      description:
        'get the students requestCallback data and softwareCourseData.',
      tags: ['api'],
      validate: {
        query: Joi.object({
          limit: Joi.number().integer(),
          page: Joi.number().integer(),
          dataType: Joi.string(),
          searchName: Joi.string(),
          searchNumber: Joi.number().integer(),
          searchPartnerName: Joi.string(),
          searchCampusName: Joi.string(),
          searchDonorName: Joi.string(),
          searchOwnerName: Joi.string(),
          gender: Joi.number().integer(),
          stage: Joi.string(),
          from: Joi.date(),
          to: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        const data = await studentService.studentsDataForDashBoard(
          request.query.dataType,
          fromDate,
          toDate,
          request.query.stage,
          request.query.limit,
          request.query.page,
          request.query.searchName,
          request.query.searchNumber,
          request.query.searchPartnerName,
          request.query.searchDonorName,
          request.query.searchCampusName,
          request.query.searchOwnerName,
          request.query.searchStatus,
          request.query.gender
        );
        if (
          !fromDate
          && !toDate
          && data.results.length <= CONSTANTS.allStudentListSize
        ) {
          return { data: data };
        }

        if (data.results.length <= CONSTANTS.allStudentListSize) {
          return { data: data };
        }
        return {
          data: {
            ...data,
            results: data.results.slice(
              data.results.length - CONSTANTS.allStudentListSize,
              data.results.length
            ),
          },
          message: `Number of rows are more than ${CONSTANTS.allStudentListSize}`,
        };
      },
    },
  },
  {
    method: 'POST',
    path: '/students/changeStage/{studentId}',
    options: {
      description: 'Change student stage by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          stage: Joi.string()
            .valid(...CONSTANTS.studentStages)
            .required(),
            transition_done_by: Joi.string(),
        }),
      },
      handler: async (request) => {
        const {
          studentService,
          assessmentService,
          ownersService,
          feedbackService,
        } = request.services();
        const studentStatus = await studentService.getStudentById(
          request.params.studentId
        );
        const [student] = studentStatus;
        if (student.current_owner_id) {
          request.payload.current_owner_id = null;
        }

        const changedStage = await assessmentService.patchStudentDetails(
          { student_id: request.params.studentId, student },
          request.payload
        );
        if (
          [
            'pendingEnglishInterview',
            'pendingAlgebraInterview',
            'pendingCultureFitInterview',
          ].includes(request.payload.stage)
        ) {
          const assignWork = await ownersService.autoAssignFeat(
            {
              who_assign: '-*auto assign*-',
              student_stage: request.payload.stage,
              student_id: request.params.studentId,
            },
            feedbackService,
            request.payload.stage,
            request.params.studentId
          );
        }

        if (changedStage) {
          return { data: 'Successfully changed stage' };
        }
        throw Boom.badRequest(
          'The Mobile number specified is wrong. Please check and try again.'
        );
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/transition/{transitionId}',
    options: {
      description: 'Change created_at for a transition by ID',
      tags: ['api'],
      validate: {
        params: Joi.object({
          transitionId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          when: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();

        return studentService.joiningDateChange(
          request.params.transitionId,
          request.payload.when
        );
      },
    },
  },
  {
    method: 'DELETE',
    path: '/students/transition/{transitionId}',
    options: {
      description: 'Change created_at for a transition by ID',
      tags: ['api'],
      validate: {
        params: Joi.object({
          transitionId: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();

        return studentService.deleteTransition(request.params.transitionId);
      },
    },
  },
  {
    method: 'DELETE',
    path: '/students/{studentId}',
    options: {
      description: 'delete student by student Id',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();

        return studentService.deleteStudentDetails(request.params.studentId);
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/redflag/{studentId}',
    options: {
      description: 'updates the flag pf the student',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          flag: Joi.string().allow(null, ''),
        }),
      },
      handler: async (request) => {
        const { flag } = request.payload;
        const redflag = flag;
        const { studentService } = request.services();
        const updatedFlag = await studentService.updateRedFlag(
          request.params.studentId,
          redflag
        );
        if (updatedFlag > 0) {
          return { data: 'Successfully Updated flag' };
        }
        return { data: 'Update failed' };
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/{studentId}',
    options: {
      description:
        'Change student campus, donor, name, partner id by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          partner_id: Joi.number().integer(),
          name: Joi.string(),
          campus: Joi.string().valid(
            'No Campus Assigned',
            ...CONSTANTS.campus.map((campus) => campus.name)
          ),
          evaluation: Joi.string(),

          donor: Joi.array().items(
            Joi.number()
              .integer()
              .valid(...CONSTANTS.donor.map((ids) => ids.id))
          ),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const {
          partner_id, name, evaluation
        } = request.payload;
        const changedPartner_id = partner_id
          ? await studentService.updatePatnerId(
            request.params.studentId,
            partner_id
          )
          : false;
        if (changedPartner_id) {
          return { data: 'Successfully changed partner' };
        }

        const changedName = name
          ? await studentService.addOrUpdateName(request.params.studentId, name)
          : false;
        if (changedName) {
          return { data: 'Successfully changed Name' };
        }

        const changedEvaluation = evaluation
          ? await studentService.updateEvaluationData(
            request.params.studentId,
            evaluation
          )
          : false;
        if (changedEvaluation) {
          return { data: 'Successfully changed EvaluationData' };
        }

        const { campusService } = request.services();
        const { campus } = request.payload;
        const { studentCampusService } = request.services();
        const deleteStudentFromCampus = campus === 'No Campus Assigned'
          ? await studentCampusService.removeCampusById(
            request.params.studentId
          )
          : false;
        if (deleteStudentFromCampus.success) {
          return { data: 'Successfully removed student from campus' };
        }

        const changedCampus = campus
          ? await campusService.updateOrInsertById(
            request.params.studentId,
            campus
          )
          : false;
        if (changedCampus.success) {
          return { data: 'Successfully changed campus' };
        }

        const { studentDonorService } = request.services();
        const { donor } = request.payload;
        const changedDonor = donor
          ? await studentDonorService.updateOrInsertById(
            request.params.studentId,
            donor
          )
          : false;

        if (changedDonor.success) {
          return { data: 'Successfully changed doner' };
        }
        throw Boom.badRequest(
          'The specified studentId is wrong. Please check and try again.'
        );
      },
    },
  },
  {
    method: 'GET',
    path: '/students/transitions/{studentId}',
    options: {
      description: 'get transition data by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentTransitions = await studentService.getTransitionData(
          request.params.studentId
        );
        if (studentTransitions) {
          return { data: studentTransitions };
        }
        throw Boom.badRequest(
          'The studentId specified is wrong. Please checks and try again.'
        );
      },
    },
  },
  {
    method: 'GET',
    path: '/students/report/dangling',
    options: {
      description:
        'get dangling students record distribution on basis of student stage and gender',
      tags: ['api'],
      handler: async (request) => {
        const { studentService } = request.services();
        const record = await studentService.stageWiseDanglingReport();
        return { data: record };
      },
    },
  },
  {
    method: 'GET',
    path: '/students/report/all',
    options: {
      description:
        'get all students record distribution on basis of student stage and gender',
      tags: ['api'],
      handler: async (request) => {
        const { studentService } = request.services();
        const record = await studentService.stageWiseGenderDistribution();
        return { data: record };
      },
    },
  },
  {
    method: 'POST',
    path: '/students/percentile/{enrolmentKey}',
    options: {
      description: 'The student with the given ID needs to be called back.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          enrolmentKey: EnrolmentKey.field('key'),
        }),
        payload: Joi.object({
          state: Student.field('state'),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const percentile = await studentService.getStudentsPercentile(
          request.params.enrolmentKey,
          request.payload
        );
        return {
          data: percentile,
        };
      },
    },
  },
  {
    method: 'POST',
    path: '/students/tag/{studentId}',
    options: {
      description: 'Add tag for online classes by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          tag: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentStatus = await studentService.addTagForOnlineClasses(
          request.params.studentId,
          request.payload.tag
        );
        if (studentStatus) {
          return { data: studentStatus };
        }
        throw Boom.badRequest(
          'The specified studentId is wrong. Please check and try again.'
        );
      },
    },
  },
  {
    method: 'POST',
    path: '/students/contactUpdateAdd/{studentId}',
    options: {
      description: 'Add tag for online classes by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          mobile: Contact.field('mobile'),
          alt_mobile: Contact.field('alt_mobile'),
          contact_type: Contact.field('contact_type'),
          updateOrAddType: Joi.string()
            .valid(...CONSTANTS.contactAddOrUpdateType)
            .required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentStatus = await studentService.addAndUpdateContact(
          request.payload,
          request.params.studentId
        );
        if (studentStatus) {
          return { data: studentStatus };
        }
        throw Boom.badRequest(
          'The specified studentId is wrong. Please check and try again.'
        );
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/updateEmail/{studentId}',
    options: {
      description: 'Update email by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          email: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const { email } = request.payload;
        const studentStatus = await studentService.addOrUpdateEmail(
          email,
          request.params.studentId
        );
        if (studentStatus) {
          return { data: studentStatus };
        }
        throw Boom.badRequest(
          'The specified studentId is wrong. Please check and try again.'
        );
      },
    },
  },
  {
    method: 'GET',
    path: '/students/{studentId}',
    options: {
      description: 'get student detail by Id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentDetail = await studentService.getStudentById(
          request.params.studentId
        );
        return { data: studentDetail };
      },
    },
  },
  {
    method: 'POST',
    path: '/students/resume/documents',
    options: {
      description: 'Upload images to s3 bucket',
      tags: ['api'],
      payload: {
        maxBytes: 1024 * 1024 * 1,
        multipart: {
          output: 'stream',
        },
        parse: true,
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form',
        },
      },
      validate: {
        payload: Joi.object({
          file: Joi.any().meta({ swaggerType: 'file' }),
        }),
      },
      handler: async (request) => {
        const { file } = request.payload;
        const uploadType = 'students_documents';
        const Helpers = require('../helpers');
        let result;
        try {
          result = await Helpers.uploadToS3(file, uploadType);
          console.log(result)
        } catch (error) {
          return [errorHandler(error), null];
        }
        return result;
      },
    },
  },
  {
    method: 'POST',
    path: '/students/uploadDocument/{studentId}',
    options: {
      description: 'upload or edit student documents by studentId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          Resume_link: Joi.string(),
          Id_proof_link: Joi.string(),
          signed_consent_link: Joi.string(),
          marksheet_link: Joi.string(),
        }),
      },
      handler: async (request) => {
        const {
          studentDocumentsService
        } = request.services();
        const studentStatus = await studentDocumentsService.insertOrUpdate(
          request.params.studentId,request.payload
        );
        return studentStatus
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/jobDetails/{id}',
    options: {
      description: 'edit student job details by job details id',
      tags: ['api'],
      validate: {
        params:Joi.object({
          id: Joi.number().integer()
        }),
        payload: Joi.object({
          student_id: Joi.number().integer().greater(0).required(),
          job_designation: Joi.string(),
          job_location: Joi.string(),
          salary: Joi.string(),
          job_type: Joi.string(),
          employer: Joi.string(),
          resume: Joi.string(),
          offer_letter_date: Joi.date(),
          video_link:Joi.string(),
          photo_link:Joi.string(),
          write_up:Joi.string(),
        }),
      },
      handler: async (request) => {
        const {
          studentService
        } = request.services();
        const studentStatus = await studentService
        .UpdateJobDescription(
          request.payload,request.params.id
        );
        return studentStatus
      },
    },
  },
  {
    method: 'POST',
    path: '/students/jobDetails',
    options: {
      description: 'add a new entry of job details',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          student_id: Joi.number().integer().greater(0).required(),
          job_designation: Joi.string(),
          job_location: Joi.string(),
          salary: Joi.string(),
          job_type: Joi.string(),
          employer: Joi.string(),
          resume: Joi.string(),
          offer_letter_date: Joi.date(),
          video_link:Joi.string(),
          photo_link:Joi.string(),
          write_up:Joi.string(),
        }),
      },
      handler: async (request) => {
        const {
          studentService
        } = request.services();
        const studentStatus = await studentService
        .insertJobDescription(
          request.payload
        );
        return studentStatus
      },
    },
  },
  {
    method: 'GET',
    path: '/students/jobDetails',
    options: {
      description: 'upload or edit student job details by studentId',
      tags: ['api'],
      handler: async (request) => {
        const {
          studentService
        } = request.services();
        const studentStatus = await studentService
        .getJobDescription();
        return studentStatus
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/updateDetails/{student_id}',
    options: {
      description:
        'update the details of student answering the test.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          student_id: Student.field('id'),
        }),
        payload: Joi.object({
          name: Student.field('name'),
          gender: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.gender)),
          dob: Student.field('dob'),
          // whatsapp: Joi.string().length(10),
          // alt_mobile: Joi.string().length(10).allow(null),
          email: Student.field('email'),
          state: Student.field('state'),
          city: Student.field('city'),
          district: Student.field('district'),
          gps_lat: Student.field('gps_lat'),
          gps_long: Student.field('gps_long'),
          pin_code: Student.field('pin_code'),
          qualification: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.qualification)),
          current_status: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.currentStatus)),
          school_medium: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.school_medium)),
          caste: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.caste)),
          religon: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.religon)),
          campus_status: Joi.string(),
          percentage_in10th: Student.field('percentage_in10th'),
          math_marks_in10th: Student.field('math_marks_in10th'),
          percentage_in12th: Student.field('percentage_in12th'),
          math_marks_in12th: Student.field('math_marks_in12th'),
          partner_refer: Student.field('partner_refer'),
          other_activities: Student.field('other_activities'),
        }),
      },
      handler: async (request) => {

        try {

         
        const { studentService } = request.services();
        const studentDetail = await studentService.updateStudentDetails(
          request.params.student_id,studentService.swapEnumKeysWithValues(request.payload)
        );

          return {
            sucess: true,
          };
        } catch (err) {
          console.log(123,err)
          return err
        }
      },
    },
  },


  {
    method: 'Post',
    path: '/students/newStudents',
    options: {
      description:
        'new students without giving tests, because many students details are not there in dashboard. But they are in campus. This api is to add those student to dashboard',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          name: Student.field('name'),
          gender: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.gender)),
          dob: Student.field('dob'),
          stage: Joi.string().valid('finallyJoined','inJob'),
          whatsapp: Joi.string().length(10),
          alt_mobile: Joi.string().length(10).allow(null),
          state: Student.field('state'),
          city: Student.field('city'),
          district: Student.field('district'),
          pin_code: Student.field('pin_code'),
          qualification: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.qualification)),
          current_status: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.currentStatus)),
          school_medium: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.school_medium)),
          caste: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.caste)),
          religon: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.religon)),
          partner_id: Joi.number().integer(),
          campus: Joi.number().integer().valid(
            ...CONSTANTS.campus.map((campus) => campus.id)
          ),
          campus_status: Joi.string(),
          donor: Joi.array().items(
            Joi.number()
              .integer()
              .valid(...CONSTANTS.donor.map((ids) => ids.id))
          ),
        }),
      },
      handler: async (request) => {
        const { donor } = request.payload;
        const {  studentDonorService, studentService, campusService } = request.services();
        payload = studentService.swapEnumKeysWithValues(request.payload);
        const details = await studentService.createWithoutExam(payload);
        await studentDonorService.updateOrInsertById(
          details.id,
          donor
        )
        return details
      },
    },
  },

  {
    method: 'POST',
    path: '/student/interview/{studentId}',
    options: {
      description: 'new student interview information update by student id',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Joi.number().integer().required(),
        }),
        payload: Joi.object({
          from_stage: Joi.string(),
          to_stage: Joi.string(),
          interviewer_feedback: Joi.string(),
          transition_done_by: Joi.string(),
          created_at: Joi.date(),
        }),
      },
    },
    handler: async (request) => {
      const { interviewService } = request.services();
      const studentDetails = await interviewService.insertOrUpdateStudentDetails(
        request.params.studentId,
        request.payload
      );
      return studentDetails;
    },
  },

  
];
