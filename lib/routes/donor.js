const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: 'GET',
    path: '/Donors/progress_made/{donorName}',
    options: {
      description: 'Get all partner students details for progress made.',
      tags: ['api'],
      validate: {
        params: {
            donorName: Joi.string(),        },
      },
      handler: async (request) => {
        const { donorService } = request.services();

        const students = await donorService.progressMade(
          request.params.donorName,
        );
        return { data: students };
      },
    },
  },
];