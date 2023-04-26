const Joi = require('joi');
const Feedback = require('../models/feedback');
const Student = require('../models/student');
const User = require('../models/user');
const CONSTANTS = require('../constants');
const logger = require('../../server/logger');

module.exports = [
  {
    method: 'POST',
    path: '/students/feedback/{studentId}/{userId}',
    options: {
      description: 'Get the students requestCallback data and softwareCourseData.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          student_stage: Feedback.field('student_stage'),
          feedback: Feedback.field('feedback'),
        }),
        params: Joi.object({
          studentId: Student.field('id'),
          userId: User.field('id'),
        }),
      },
      handler: async (request) => {
        const { studentService, feedbackService } = request.services();
        const Students = await studentService.getStudentById(request.params.studentId);
        const [student] = Students;
        const feedback = await feedbackService.addFeedback(
          student,
          request.params.userId,
          request.payload
        );
        logger.info('Get the students requestCallback data and softwareCourseData.');
        return {
          data: feedback,
        };
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/feedback/{studentId}',
    options: {
      description: 'Update students state using studentId',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          student_stage: Joi.string().valid(...CONSTANTS.studentStages),
          state: Feedback.field('state'),
        }),
        params: Joi.object({
          studentId: Student.field('id'),
        }),
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const updated = await feedbackService.updateFeedback(
          request.payload,
          request.params.studentId
        );
        logger.info('Update students state using studentId');
        return updated;
      },
    },
  },
  {
    method: 'POST',
    path: '/students/assign_feedback_work',
    options: {
      description: 'Assign feedback work for mobilization team',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          who_assign: Feedback.field('who_assign'),
          to_assign: Feedback.field('to_assign'),
          student_stage: Feedback.field('student_stage'),
          student_id: Student.field('id'),
        }),
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const assignWork = await feedbackService.assignFeedbackWork(request.payload);
        if (assignWork) {
          logger.info('Assign feedback work for mobilization team');
          return {
            data: 'Successfully assigned work!',
          };
        }
        logger.info('Assign feedback work for mobilization team');
        return null;
      },
    },
  },
  {
    method: 'GET',
    path: '/students/sheetInfo',
    options: {
      description: 'The student with the given ID needs to be called back.',
      tags: ['api'],
      handler: async (request) => {
        const { feedbackService } = request.services();
        const dump = await feedbackService.dumpSheetData();
        if (dump) {
          logger.info('The student with the given ID needs to be called back.');
          return {
            data: true,
          };
        }
        logger.info('The student with the given ID needs to be called back.');
        return null;
      },
    },
  },
  {
    method: 'GET',
    path: '/students/transitionsWithFeedback/{studentId}',
    options: {
      description: 'Get all alltransitions by studentId.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Student.field('id'),
        }),
      },
      handler: async (request) => {
        const { feedbackService, studentService } = request.services();
        const dump = await feedbackService.alltransitionsWithFeedback(request.params.studentId);
        const contacts = await studentService.getContacts(request.params.studentId); // getting contacts for students extra details.
        if (dump) {
          logger.info('Get all alltransitions by studentId.');
          return {
            data: dump,
            contacts: contacts,
          };
        }
        logger.info('Get all alltransitions by studentId.');
        return null;
      },
    },
  },
  {
    method: 'PUT',
    path: '/students/updateDeadlineOrFinishedAt/{transitionId}',
    options: {
      description: 'Update deadline and finished at date by transition id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          transitionId: Joi.number().integer(),
        }),
        payload: Joi.object({
          deadline_at: Joi.date(),
          finished_at: Joi.date(),
        }),
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        logger.info('Update deadline and finished at date by transition id.');
        return await feedbackService.updateDeadlineOrFinishedAt(
          request.params.transitionId,
          request.payload
        );
      },
    },
  },
  {
    method: 'GET',
    path: '/students/my_tasks',
    options: {
      description: 'Get all owner record',
      tags: ['api'],
      validate: {
        options: Joi.object({
          allowUnknown: true,
        }),
        query: Joi.object({
          user: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const report = await feedbackService.myTaskReport(request.query.user);
        logger.info('Get all owner record');
        return { data: report };
      },
    },
  },
  {
    method: 'GET',
    path: '/students/my_assigns',
    options: {
      description: 'Get all assign users report',
      tags: ['api'],
      validate: {
        options: Joi.object({
          allowUnknown: true,
        }),
        query: Joi.object({
          user: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const report = await feedbackService.myAssignReport(request.query.user);
        if (report) {
          logger.info('Get all assign users report');
          return { data: report };
        }
        logger.info('Get all assign users report');
        return null;
      },
    },
  },
  {
    method: 'GET',
    path: '/students/send_sms_to/assig_user', // this end point is for testing send SMS to assign user.
    options: {
      description: 'The student with the given ID needs to be called back.',
      tags: ['api'],
      handler: async (request) => {
        const { feedbackService } = request.services();
        const data = await feedbackService.informPendingMobilizationWorkto_assignUser();
        if (data) {
          logger.info('The student with the given ID needs to be called back.');
          return {
            message: 'Successfully send pending work SMS to assigned users.',
          };
        }
        logger.info('The student with the given ID needs to be called back.');
        return null;
      },
    },
  },
  {
    method: 'POST',
    path: '/students/audioRecording/{studentId}/{userId}',
    options: {
      description: 'Insert interview audio recorded AWS s3 URL in database.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          studentId: Student.field('id'),
          userId: User.field('id'),
        }),
        payload: Joi.object({
          audioUrl: Joi.string().required(),
          student_stage: Feedback.field('student_stage'),
        }),
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const response = await feedbackService.addaudio_recordingUrl(
          request.params,
          request.payload
        );
        if (response) {
          logger.info('Insert interview audio recorded AWS s3 URL in database.');
          return {
            sucess: true,
          };
        }
        logger.info('Insert interview audio recorded AWS s3 URL in database.');
        return { sucess: false };
      },
    },
  },
  {
    method: 'GET',
    path: '/students/pending_interview',
    options: {
      description: 'Get all pending interview for particular interviwer',
      tags: ['api'],
      validate: {
        options: Joi.object({
          allowUnknown: true,
        }),
        query: Joi.object({
          user: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const pendingInterview = await feedbackService.pendingInterview(request.query.user);
        logger.info('Get all pending interview for particular interviwer');
        return { data: pendingInterview };
      },
    },
  },
];
