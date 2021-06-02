/* eslint-disable no-unused-vars */
const Joi = require('joi');

module.exports = [
  {
    method: 'GET',
    path: '/outreach/records',
    options: {
      description: 'Get statistical data of each outreach',
      tags: ['api'],
      handler: async (request) => {
        const { outreachService } = request.services();
        return outreachService.getAllOutreachData();
      },
    },
  },
];
