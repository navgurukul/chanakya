const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [
  {
    method: 'GET',
    path: '/donor/{donerId}/students',
    options: {
      description: 'Get all partner students details for progress made.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          donerId: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { donorService } = request.services();

        const students = await donorService.progressMade(request.params.donerId);
        logger.info('Get all partner students details for progress made.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/donor/{donerId}/students/distribution',
    options: {
      description: 'Get all partner students details for progress made graph distribution.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          donerId: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { graphService, donorService } = request.services();
        const students = await graphService.graph(
          await donorService.progressMade(request.params.donerId)
        );
        logger.info('Get all partner students details for progress made graph distribution.');
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
        let result;
        try {
          const { donorService } = request.services();
          result = await donorService.findall();
        } catch (err) {
          return { message: err.message, error: true };
        }
        logger.info('List of all donors in the system.');
        return result;
      },
    },
  },
  {
    method: 'GET',
    path: '/donor/{donerId}/students/progress_made_card',
    options: {
      description: 'Get all partner students details for progress made card.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          donerId: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { donorService, studentProgressService } = request.services();

        const students = await studentProgressService.student_progressMade_Cards(
          await donorService.progressMade(request.params.donerId)
        );
        logger.info('Get all partner students details for progress made card.');
        return { data: students };
      },
    },
  },
];
