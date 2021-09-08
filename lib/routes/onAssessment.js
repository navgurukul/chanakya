const Joi = require('joi');
const Boom = require('boom');
const _ = require('underscore');
const EnrolmentKey = require('../models/enrolmentKey');
const CONSTANTS = require('../constants');
const Student = require('../models/student');

const internals = {};

// helper methods
internals.validateEnrolmentKey = async (assessmentService, key) => {
  const enrolmentKey = await assessmentService.validateEnrolmentKey(key);
  if (!enrolmentKey) {
    throw Boom.badRequest('The Enrolment Key specified is wrong. Please check and try again.');
  }
  return enrolmentKey;
};
internals.ensureEnrolmentKeyStatus = (assessmentService, key) => {
  const keyStatus = assessmentService.getEnrolmentKeyStatus(key);
  if (keyStatus === 'testAnswered') {
    throw Boom.conflict('This enrolment key has already been used to answer a test.');
  }
  return keyStatus;
};

module.exports = [
  {
    method: 'GET',
    path: '/on_assessment/validate_enrolment_key/{enrolmentKey}',
    options: {
      description: 'Validates the given enrolment key.',
      tags: ['api'],
      validate: {
        params: {
          enrolmentKey: EnrolmentKey.field('key'),
        },
      },
      handler: async (request) => {
        const { assessmentService } = request.services();

        const enrolmentKey = await assessmentService
          .validateEnrolmentKey(request.params.enrolmentKey);
        const keyStatus = assessmentService.getEnrolmentKeyStatus(enrolmentKey);
        if (enrolmentKey) {
          // geting students stage for front end.
          return { valid: true, keyStatus, stage: enrolmentKey.student.stage };
        }
        return { valid: false, keyStatus };
      },
    },
  },
  {
    method: 'POST',
    path: '/on_assessment/details/{enrolmentKey}',
    options: {
      description: 'Save the details of student answering the test. Can be used in stages according to frontend.',
      tags: ['api'],
      validate: {
        params: {
          enrolmentKey: EnrolmentKey.field('key'),
        },
        payload: {
          name: Student.field('name'),
          gender: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.gender)),
          dob: Student.field('dob'),
          whatsapp: Joi.string().length(10),

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

          percentage_in10th: Student.field('percentage_in10th'),
          math_marks_in10th: Student.field('math_marks_in10th'),
          percentage_in12th: Student.field('percentage_in12th'),
          math_marks_in12th: Student.field('math_marks_in12th'),
        },
      },
      handler: async (request) => {
        const { assessmentService, studentService } = request.services();

        const enrolmentKey = await internals
          .validateEnrolmentKey(assessmentService, request.params.enrolmentKey);

        // decide the stage on basis of the details being edited
        // this is important to prevent this endpoint being used multiple times from the frontend
        // the frontend can ensure not showing a particular form for certain details
        // on basis of the stage
        await enrolmentKey.$relatedQuery('student');
        const { student } = enrolmentKey;
        let { payload } = request;
        if (student.stage === 'enrolmentKeyGenerated' && payload.name && payload.whatsapp && payload.gender && payload.dob) {
          payload.stage = 'basicDetailsEntered';
        } else if (student.stage === 'completedTest') {
          payload.stage = 'completedTestWithDetails';
        }

        payload = studentService.swapEnumKeysWithValues(request.payload);
        await assessmentService.patchStudentDetails(enrolmentKey, payload);
        return { sucess: true };
      },
    },
  },
  {
    method: 'POST',
    path: '/on_assessment/questions/{enrolmentKey}',
    options: {
      description: 'Get the questions associated with the given enrolment key. Starts the timer of the alloted time for the test.',
      tags: ['api'],
      validate: {
        params: {
          enrolmentKey: EnrolmentKey.field('key'),
        },
      },
      handler: async (request) => {
        const { assessmentService } = request.services();
        const enrolmentKey = await internals
          .validateEnrolmentKey(assessmentService, request.params.enrolmentKey);
        internals.ensureEnrolmentKeyStatus(assessmentService, enrolmentKey);

        const questions = await assessmentService.getQuestionSetForEnrolmentKey(enrolmentKey);
        console.log(_.map(questions, (q) => q.id));
        return {
          data: questions,
          availableTime: CONSTANTS.questions.timeAllowed,
        };
      },
    },
  },
  {
    method: 'POST',
    path: '/on_assessment/questions/{enrolmentKey}/answers',
    options: {
      description: 'Saves the answers given by the student. Saves the end time of the test.',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true,
        },
        params: {
          enrolmentKey: EnrolmentKey.field('key'),
        },
        payload: Joi.object(),
      },
      handler: async (request) => {
        const { assessmentService } = request.services();

        // swap empty strings with nulls
        const payload = _.object(_.map(_.pairs(request.payload), (x) => [x[0], x[1] === '' ? null : x[1]]));

        const enrolmentKey = await internals
          .validateEnrolmentKey(assessmentService, request.params.enrolmentKey);
        internals.ensureEnrolmentKeyStatus(assessmentService, enrolmentKey);

        await assessmentService.recordStudentAnswers(enrolmentKey, payload);

        return { success: true };
      },
    },
  },
  {
    method: 'GET',
    path: '/on_assessment/Show_testResult/{enrolmentKey}',
    options: {
      description: 'Inform test result immediately after giving online test.',
      tags: ['api'],
      validate: {
        params: {
          enrolmentKey: EnrolmentKey.field('key'),
        },
      },
      handler: async (request) => {
        const { assessmentService } = request.services();

        const testResult = await assessmentService
          .ShowTestResult(request.params.enrolmentKey);
        if (testResult) {
          return testResult;
        }
        return { Result: false };
      },
    },
  },
];
