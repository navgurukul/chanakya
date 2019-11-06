const Joi = require('joi');
const Boom = require('boom');
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
        if (studentStatus.length) {
          return { data: studentStatus };
        }
        throw Boom.badRequest('The Mobile number specified is wrong. Please check and try again.');
      },
    },
  },
  {
    method: 'GET',
    path: '/students',
    options: {
      description: 'get the students requestCallback data and softwareCourseData.',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true,
        },
        query: {
          typeOfData: Joi.string().valid(...CONSTANTS.studentTypeOfData).required(),
          from: Joi.date(),
          to: Joi.date(),
          last: Joi.date(),
        },
      },
      handler: async (request) => {
        const { studentService } = request.services();
        const fromDate = request.query.from;
        const toDate = request.query.to;
        const lastDate = request.query.last;
        const data = await studentService.studentsDataForDashBoard(request.query.typeOfData,
          fromDate, toDate, lastDate);
        if (data.length <= 2000) {
          return { data };
        }
        throw Boom.badRequest('More than 2000 entry is exist');
      },
    },
  },
];
