const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: 'GET',
    path: '/Campus/progress_made/{campus}',
    options: {
      description: 'Get all partner students details for progress made.',
      tags: ['api'],
      validate: {
        params: {
            campus: Joi.string(),        },
      },
      handler: async (request) => {
        const { campusService } = request.services();

        const students = await campusService.progressMade(
          request.params.campus,
        );
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/Campus',
    options: {
        description: "List of all campus in the system.",
        tags: ["api"],
        handler: async (request) => {
          
          return { data: CONSTANTS.campus };
        },
      },
    
},
];