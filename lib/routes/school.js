/* eslint-disable no-unused-vars */
const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
const Student = require('../models/student');
const EnrolmentKey = require('../models/enrolmentKey');
const Contact = require('../models/studentContact');
const CONSTANTS = require('../constants');

module.exports = [
  {
    method: 'POST',
    path: '/school',
    options: {
      description: 'Get students school',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
      },
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { schoolService } = request.services();
        // console.log(request.payload, 'routes', request.auth.credentials.id);
        try {
          const data = await schoolService.school_name(
            request.payload.name,
            request.auth.credentials.id
          );
          return data;
        } catch (err) {
          return err;
        }
      },
    },
  },
];
