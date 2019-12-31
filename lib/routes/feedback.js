const Joi = require('joi');
const Boom = require('boom');
const Feedback = require('../models/feedback');
const Student = require('../models/student');
const User = require('../models/user');

module.exports = [
  {
    method: 'POST',
    path: '/students/feedback/{studentId}/{userId}',
    options: {
      description: 'get the students requestCallback data and softwareCourseData.',
      tags: ['api'],
      validate: {
        payload: {
          student_stage: Feedback.field('student_stage'),
          feedback: Feedback.field('feedback'),
          state: Feedback.field('state'),
        },
        params: {
          studentId: Student.field('id'),
          userId: User.field('id'),
        },
      },
      handler: async (request) => {
        const { studentService, feedbackService } = request.services();
        const Students = await studentService.getStudnetById(request.params.studentId);
        const [student] = Students;
        const feedback = await feedbackService.addFeedback(student, request.params.userId,
          request.payload);
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
      description: 'Update studetns feedback using studentId',
      tags: ['api'],
      validate: {
        payload: {
          student_stage: Feedback.field('student_stage'),
          feedback: Feedback.field('feedback'),
          state: Feedback.field('state'),
        },
        params: {
          studentId: Student.field('id'),
        },
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const updated = await feedbackService.updateFeedback(request.payload,
          request.params.studentId);
        if (updated > 0) {
          return {
            data: updated,
          };
        }
        throw Boom.badRequest('Please give feedback and try again.');
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
        payload: {
          whoAssign: Feedback.field('whoAssign'),
          toAssign: Feedback.field('toAssign'),
          student_stage: Feedback.field('student_stage'),
          studentId: Student.field('id'),
        },
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const assignWork = await feedbackService.assignFeedbackWork(request.payload);
        if (assignWork) {
          return {
            data: 'Successfully assigned work!',
          };
        }
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
          return {
            data: true,
          };
        }
        return null;
      },
    },
  },
  {
    method: 'GET',
    path: '/students/transitionsWithFeedback/{studentId}',
    options: {
      description: 'get all alltransitions by studentId.',
      tags: ['api'],
      validate: {
        params: {
          studentId: Student.field('id'),
        },
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const dump = await feedbackService.alltransitionsWithFeedback(request.params.studentId);
        if (dump) {
          return {
            data: dump,
          };
        }
        return null;
      },
    },
  },
  {
    method: 'GET',
    path: '/students/my_tasks',
    options: {
      description: 'get all owner record',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true,
        },
        query: {
          user: Joi.string(),
        },
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const report = await feedbackService.myTaskReport(request.query.user);
        return { data: report };
      },
    },
  },
  {
    method: 'GET',
    path: '/students/my_assigns',
    options: {
      description: 'get all assign users report',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true,
        },
        query: {
          user: Joi.string(),
        },
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const report = await feedbackService.myAssignReport(request.query.user);
        if (report) {
          return { data: report };
        }
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
        const data = await feedbackService.informPendingMobilizationWorkToAssignUser();
        if (data) {
          return {
            message: 'Successfully send pending work SMS to assigned users.',
          };
        }
        return null;
      },
    },
  },
];
