const Joi = require('joi');
const Boom = require('boom');
const _ = require('underscore');
const EnrolmentKey = require('../models/enrolmentKey');
const CONSTANTS = require('../constants');
const Student = require('../models/student');
const Helpers = require('../helpers');
const { errorHandler } = require('../../errors/index');
const logger = require('../../server/logger');

const internals = {};

// helper methods
internals.validateEnrolmentKey = async (assessmentService, key) => {
  const enrolmentKey = await assessmentService.validateEnrolmentKey(key);
  if (!enrolmentKey) {
    logger.error(
      JSON.stringify({
        error: true,
        message: 'The Enrolment Key specified is wrong. Please check and try again.',
      })
    );
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
    method: 'POST',
    path: '/on_assessment/details/photo/{enrolmentKey}',
    options: {
      description: 'Upload images to s3 bucket',
      tags: ['api'],
      payload: {
        maxBytes: 1024 * 1024 * 5,
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
        params: Joi.object({
          enrolmentKey: EnrolmentKey.field('key'),
        }),
        payload: Joi.object({
          file: Joi.any().meta({ swaggerType: 'file' }),
        }),
      },
      handler: async (request) => {
        const { file } = request.payload;
        const uploadType = 'profileImg';
        const { enrolmentKey } = request.params;
        let result;
        try {
          const { studentService } = request.services();
          const fileS3URL = await Helpers.uploadToS3(file, uploadType);
          result = await studentService.addOrUpdateImgUlr(fileS3URL, enrolmentKey);
        } catch (error) {
          return [errorHandler(error), null];
        }
        logger.info('Upload images to s3 bucket');
        return result;
      },
    },
  },
  {
    method: 'GET',
    path: '/on_assessment/validate_enrolment_key/{enrolmentKey}',
    options: {
      description: 'Validates the given enrolment key.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          enrolmentKey: EnrolmentKey.field('key'),
        }),
      },
      handler: async (request) => {
        const { assessmentService } = request.services();

        const enrolmentKey = await assessmentService.validateEnrolmentKey(
          request.params.enrolmentKey
        );
        const keyStatus = assessmentService.getEnrolmentKeyStatus(enrolmentKey);
        if (enrolmentKey) {
          // geting students stage for front end.
          logger.info('Validates the given enrolment key.');
          return { valid: true, keyStatus, stage: enrolmentKey.student.stage };
        }
        logger.info('Validates the given enrolment key.');
        return { valid: false, keyStatus };
      },
    },
  },
  {
    method: 'POST',
    path: '/on_assessment/details/{enrolmentKey}',
    options: {
      description:
        'Save the details of student answering the test. Can be used in stages according to frontend.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          enrolmentKey: EnrolmentKey.field('key'),
        }),
        payload: Joi.object({
          name: Student.field('name'),
          gender: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.gender)),
          dob: Student.field('dob'),
          whatsapp: Joi.string().length(10),
          alt_mobile: Joi.string().length(10).allow(null),
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
          partner_refer: Student.field('partner_refer'),
        }),
      },
      handler: async (request) => {
        const { assessmentService, studentService } = request.services();

        try {
          const enrolmentKey = await internals.validateEnrolmentKey(
            assessmentService,
            request.params.enrolmentKey
          );

          // decide the stage on basis of the details being edited
          // this is important to prevent this endpoint being used multiple times from the frontend
          // the frontend can ensure not showing a particular form for certain details
          // on basis of the stage
          await enrolmentKey.$relatedQuery('student');
          const { student } = enrolmentKey;
          let { payload } = request;
          if (
            student.stage === 'enrolmentKeyGenerated' &&
            payload.name &&
            payload.whatsapp &&
            payload.gender &&
            payload.dob
          ) {
            payload.stage = 'basicDetailsEntered';
            payload.school = 'School Of Programming';
          } else if (student.stage === 'completedTest') {
            payload.stage = 'completedTestWithDetails';
          }

          payload = studentService.swapEnumKeysWithValues(request.payload);
          const details = await assessmentService.patchStudentDetails(enrolmentKey, payload);
          logger.info(
            'Save the details of student answering the test. Can be used in stages according to frontend.'
          );
          return {
            sucess: true,
            details,
          };
        } catch (err) {
          logger.error(JSON.stringify(err));
          return [errorHandler(err), null];
        }
      },
    },
  },
  {
    method: 'GET',
    path: '/on_assessment/questions/{enrolmentKey}',
    options: {
      description:
        'Get the questions associated with the given enrolment key. Starts the timer of the alloted time for the test.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          enrolmentKey: EnrolmentKey.field('key'),
        }),
        query:Joi.object({
          school:Joi.string().allow(null)
        
        })
      },
      handler: async (request) => {
        const { assessmentService } = request.services();
        let questions;
        try {
          const enrolmentKey = await internals.validateEnrolmentKey(
            assessmentService,
            request.params.enrolmentKey
          );
          internals.ensureEnrolmentKeyStatus(assessmentService, enrolmentKey);
          questions = await assessmentService.getQuestionSetForEnrolmentKey(enrolmentKey,request.query.school);
        } catch (error) {
          logger.error(JSON.stringify(error));
          return [errorHandler(error), null];
        }
        logger.info(
          'Get the questions associated with the given enrolment key. Starts the timer of the alloted time for the test.'
        );
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
        params: Joi.object({
          enrolmentKey: EnrolmentKey.field('key'),
        }),
        payload: Joi.object(),
      },
      handler: async (request) => {
        const { assessmentService, sendingSmsToStudents } = request.services();
        // swap empty strings with nulls
        const payload = _.object(
          _.map(_.pairs(request.payload), (x) => [x[0], x[1] === '' ? null : x[1]])
        );

        const enrolmentKey = await internals.validateEnrolmentKey(
          assessmentService,
          request.params.enrolmentKey
        );
        internals.ensureEnrolmentKeyStatus(assessmentService, enrolmentKey);

        await assessmentService.recordStudentAnswers(enrolmentKey, payload);

        const stage = await sendingSmsToStudents.getStage(enrolmentKey.student.id);
        if (
          stage == 'offerLetterSent' ||
          stage == 'pendingEnglishInterview' ||
          stage == 'testFailed'
        ) {
          const smsData = await sendingSmsToStudents.prepareSmsTemplate(enrolmentKey.student.id);
          const { formattedData, templateId } = smsData;
          const smsSend = await sendingSmsToStudents.sendSmsToStudents(
            formattedData,
            enrolmentKey.student.id,
            templateId
          );
        }

        logger.info('Saves the answers given by the student. Saves the end time of the test.');
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
        params: Joi.object({
          enrolmentKey: EnrolmentKey.field('key'),
        }),
      },
      handler: async (request) => {
        const { assessmentService } = request.services();

        const testResult = await assessmentService.ShowTestResult(request.params.enrolmentKey);
        if (testResult) {
          logger.info('Inform test result immediately after giving online test.');
          return testResult;
        }
        logger.info('Inform test result immediately after giving online test.');
        return { Result: false };
      },
    },
  },
];
