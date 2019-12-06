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
        if (updated) {
          return {
            data: updated,
          };
        }
        return null;
      },
    },
  },
  {
    method: 'POST',
    path: '/students/assinge_feedback_work',
    options: {
      description: 'Assinge feedback work for mobilization team',
      tags: ['api'],
      validate: {
        payload: {
          whoAssinge: Feedback.field('whoAssinge'),
          toAssinge: Feedback.field('toAssinge'),
          student_stage: Feedback.field('student_stage'),
          studentId: Student.field('id'),
        },
      },
      handler: async (request) => {
        const { feedbackService } = request.services();
        const assingeWork = await feedbackService.assingeFeedbackWork(request.payload);
        if (assingeWork) {
          return {
            data: 'Successfully assinged work!',
          };
        }
        return null;
      },
    },
  },
];
