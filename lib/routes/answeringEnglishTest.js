
const Joi = require('joi');
const _ = require('underscore');
const EnrolmentKey = require('../models/enrolmentKey');
const CONSTANTS = require('../constants');

module.exports = [
  {
    method: 'POST',
    path: '/englishTest/questions/{enrolment_key}/answers',
    options: {
      description: 'Saves the answers given by the student. Saves the end time of the test',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true,
        },
        params: {
          enrolment_key: EnrolmentKey.field('key'),
        },
        payload: Joi.object(),
      },
      handler: async (request) => {
        const { englishTestServices, assessmentService } = request.services();
        // swap empty strings with nulls
        const payload = _.object(_.map(_.pairs(request.payload), (x) => {
          const result = [x[0], x[1] === '' ? null : x[1]];
          return result;
        }));

        const enrolmentKey = await assessmentService
          .validateEnrolmentKey(request.params.enrolment_key);
        const key = await englishTestServices.getEnrolmentKeyStatus(enrolmentKey);
        const recoderAnswered = await englishTestServices
          .recordStudentAnswers(key.key, payload);
        if (recoderAnswered) {
          await assessmentService.patchStudentDetails(enrolmentKey, {
            stage: 'EnglishTestCompleted',
          });
        }
        return { success: true };
      },
    },
  },

  {
    method: 'GET',
    path: '/englishTest/validate_enrolment_key/{enrolmentKey}',
    options: {
      description: 'Validates the given enrolment key.',
      tags: ['api'],
      validate: {
        params: {
          enrolmentKey: EnrolmentKey.field('key'),
        },
      },
      handler: async (request) => {
        const { assessmentService, englishTestServices } = request.services();

        const enrolmentKey = await assessmentService
          .validateEnrolmentKey(request.params.enrolmentKey);
        const keyStatus = await englishTestServices.getEnrolmentKeyStatus(enrolmentKey);
        if (enrolmentKey) {
          return { valid: true, keyStatus: keyStatus.keystatus, stage: enrolmentKey.student.stage };
        }
        return { valid: false, keyStatus: keyStatus.keyStatus };
      },
    },
  },

  {
    method: 'POST',
    path: '/englishTest/questions/{enrolment_key}',
    options: {
      description: 'Get the questions And passage associated with the given enrolment key. Starts the timer of the alloted time for the test.',
      tags: ['api'],
      validate: {
        params: {
          enrolment_key: EnrolmentKey.field('key'),
        },
      },
      handler: async (request) => {
        const { assessmentService, englishTestServices } = request.services();

        const enrolmentKey = await assessmentService
          .validateEnrolmentKey(request.params.enrolment_key);
        const key = await englishTestServices.getEnrolmentKeyStatus(enrolmentKey);
        const questions = await englishTestServices.getQuestionSetForEnrolmentKey(key.key);

        console.log(_.map(questions.questions, (q) => q.id));
        return {
          data: questions,
          availableTime: CONSTANTS.questions.timeAllowed,
        };
      },
    },
  },
];
