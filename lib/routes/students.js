
const Joi = require('joi');
const _ = require('underscore');
const CONSTANTS = require('../constants');
const Student = require('../models/student');


module.exports = [
  {
    method: 'GET',
    path: '/students/{studentId}/request_callback',
    options: {
      description: 'The student with the given ID needs to be called back.',
      tags: ['api'],
      handler: async (request, h) => ({ notImplemented: true }),
    },
  },
  {
    method: 'GET',
    path: '/students/{studentId}/send_enrolment_key',
    options: {
      description: "Sends the enrolment key to students. Creates one if doesn't exist.",
      tags: ['api'],
      handler: async (request, h) => ({ notImplemented: true }),
    },
  },
];
