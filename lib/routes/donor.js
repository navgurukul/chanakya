/* eslint-disable no-return-await */
/* eslint-disable no-unused-vars */
const Joi = require('joi');
const CONSTANTS = require('../constants');

module.exports = [
  {
    method: 'GET',
    path: '/donor/{donerId}/students',
    options: {
      description: 'Get all partner students details for progress made.',
      tags: ['api'],
      validate: {
        params: {
          donerId: Joi.string(),
        },
      },
      handler: async (request) => {
        const { donorService } = request.services();

        const students = await donorService.progressMade(
          request.params.donerId,
        );
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/donors',
    options: {
      description: 'List of all donors in the system.',
      tags: ['api'],
      handler: async (request) => {
        const { donorService } = request.services();
        return await donorService.findall();
      },
    },

  },

];
