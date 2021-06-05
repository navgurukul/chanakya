/* eslint-disable no-unused-vars */
const Joi = require('joi');
const CONSTANTS = require('../constants');

module.exports = [
  {
    method: 'GET',
    path: '/campus/{campusId}/students',
    options: {
      description: 'Get all partner students details for progress made.',
      tags: ['api'],
      validate: {
        params: {
          campusId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { studentCampusService } = request.services();

        const students = await studentCampusService.progressMade(
          request.params.campusId,
        );
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/campus',
    options: {
      description: 'List of all campus in the system.',
      tags: ['api'],
      handler: async (request) => {
        const { campusService } = request.services();
        return { data: await campusService.findall() };
      },
    },

  },
];
