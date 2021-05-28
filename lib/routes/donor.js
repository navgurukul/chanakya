const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: 'GET',
    path: '/donors/progress_made/{donerId}',
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
        description: "List of all donors in the system.",
        tags: ["api"],
        handler: async (request) => {
          
          return { data: ['Microsoft','KPMG','Accenture',].map((name)=>{return {name:name}}) };
        },
      },
    
},
  
];