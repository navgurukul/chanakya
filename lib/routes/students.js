const Joi = require('joi');

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
      description: "Sends the enrolment key to students. Creates one if doesn't exist.",
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
        params: {
          mobile: Joi.string().length(10).required(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const studentStatus = await studentService.studentStatus(request.params.mobile);
        return { data: studentStatus };
      },
    },
  },
];
