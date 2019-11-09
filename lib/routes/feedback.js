const Joi = require('joi');
const Boom = require('boom');
const _ = require('underscore');
const CONSTANTS = require('../constants');
const Feedback = require('../models/feedback');
const Student = require('../models/student');

module.exports = [
  {
    method: 'POST',
    path: '/students/feedback/{studentId}',
    options: {
      description: 'get the students requestCallback data and softwareCourseData.',
      tags: ['api'],
      validate: {
        payload: {
          student_stage: Feedback.field('student_stage'),
          user: Joi.number().integer().valid(..._.values(CONSTANTS.userTypes)),
          feedback: Feedback.field('feedback'),
          state: Feedback.field('state'),
          feedback_type: Feedback.field('feedback_type'),
        },
        params: {
          studentId: Student.field('id'),
        }
      },
      handler: async (request) => {
        const { studentService, feedbackService, userService, assessmentService } = request.services();
        const Student = await studentService.getStudnetById(request.params.studentId);
        const [student] = Student;
        const user = await userService.getUserByName(request.payload.user);
        const feedback = await feedbackService.createFeedback(student, user, request.payload);
        // await assessmentService.patchStudentDetails({student}, { stage: request.payload.student_stage });
        return {
          data: feedback,
        };
      },
    },
  },
  {
    method: "PUT",
    path: '/students/feedback/{studentId}',
    options: {
      description: 'Update studetns feedback using studentId',
      tags: ['api'],
      validate: {
        payload: {
          user: Joi.number().integer().valid(..._.values(CONSTANTS.userTypes)),
          feedback: Feedback.field('feedback'),
          state: Feedback.field('state'),
        },
        params: {
          studentId: Student.field('id'),
        },
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const updated = await feedbackService.updateFeedback(request.payload, request.params.studentId);
        return {
          data: updated,
        };
      },
    },
  },
];
