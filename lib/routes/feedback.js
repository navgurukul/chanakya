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
          feedback_type: Feedback.field('feedback_type'),
        },
        params: {
          studentId: Student.field('id'),
          userId: User.field('id'),
        },
      },
      handler: async (request) => {
        const { studentService, feedbackService, assessmentService } = request.services();
        const Students = await studentService.getStudnetById(request.params.studentId);
        const [student] = Students;
        const feedback = await feedbackService.createFeedback(student, request.params.userId,
          request.payload);
        await assessmentService.patchStudentDetails({ student },
          { stage: request.payload.student_stage });
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
          feedback_type: Feedback.field('feedback_type'),
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
        return {
          data: updated,
        };
      },
    },
  },
];
