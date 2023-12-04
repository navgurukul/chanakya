const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [
  {
    method: 'POST',
    path: '/owner',
    options: {
      description: 'Create a new owner.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          user_id: Joi.number().integer().greater(0),
          gender: Joi.number().integer(),
          available: Joi.boolean(),
          max_limit: Joi.number().integer().greater(0),
          type: Joi.array().items('EnglishInterview', 'AlgebraInterview', 'CultureFitInterview'),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();

        const students = await ownersService.newOwner(request.payload);
        logger.info('Create a new owner.');
        return { data: students };
      },
    },
  },
  {
    method: 'PUT',
    path: '/owner/{ownerId}',
    options: {
      description: 'Update a owner by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          ownerId: Joi.number().integer(),
        }),
        payload: Joi.object({
          available: Joi.boolean(),
          gender: Joi.number().integer(),
          max_limit: Joi.number().integer().greater(0),
          type: Joi.array().items('EnglishInterview', 'AlgebraInterview', 'CultureFitInterview'),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();

        const students = await ownersService.updateOwner(request.payload, request.params.ownerId);
        logger.info('Update a owner by id.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/owner',
    options: {
      description: 'Get all owners.',
      tags: ['api'],
      validate: {
        query: Joi.object({
          available: Joi.boolean(),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();
        const students = await ownersService.findall(request.query);
        logger.info('Get all owners.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/owner/{ownerId}',
    options: {
      description: 'Get owner by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          ownerId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();
        const students = await ownersService.findById(request.params.ownerId);
        logger.info('Get owner by id.');
        return { data: students };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/owner/{ownerId}',
    options: {
      description: 'Delete owner by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          ownerId: Joi.number().integer(),
        }),
      },
      handler: async (request, h) => {
        const { ownersService } = request.services();
        const [err, students] = await ownersService.deleteOwnerById(request.params.ownerId);
        if (err) {
          logger.error(JSON.stringify(err));
          return h.response(err).code(err.code);
        }
        logger.info('Delete owner by id.');
        return { data: students };
      },
    },
  },
];
