const Joi = require('joi');

module.exports = [
  {
    method: 'POST',
    path: '/owner',
    options: {
      description: 'create a new owner.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          user_id: Joi.number().integer().greater(0),
          gender: Joi.number().integer(),
          available: Joi.boolean(),
          max_limit: Joi.number().integer().greater(0),
          type: Joi.array().items(
            'EnglishInterview',
            'AlgebraInterview',
            'CultureFitInterview'
          ),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();

        const students = await ownersService.newOwner(request.payload);
        return { data: students };
      },
    },
  },
  {
    method: 'PUT',
    path: '/owner/{ownerId}',
    options: {
      description: 'update a owner by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          ownerId: Joi.number().integer(),
        }),
        payload: Joi.object({
          available: Joi.boolean(),
          gender: Joi.number().integer(),
          max_limit: Joi.number().integer().greater(0),
          type: Joi.array().items(
            'EnglishInterview',
            'AlgebraInterview',
            'CultureFitInterview'
          ),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();

        const students = await ownersService.updateOwner(
          request.payload,
          request.params.ownerId
        );
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/owner',
    options: {
      description: 'get all owners.',
      tags: ['api'],
      validate: {
        query: Joi.object({
          available: Joi.boolean(),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();
        const students = await ownersService.findall(request.query);
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/owner/{ownerId}',
    options: {
      description: 'get owner by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          ownerId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { ownersService } = request.services();
        const students = await ownersService.findById(request.params.ownerId);
        return { data: students };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/owner/{ownerId}',
    options: {
      description: 'delete owner by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          ownerId: Joi.number().integer(),
        }),
      },
      handler: async (request,h) => {
        const { ownersService } = request.services();
        const [err,students] = await ownersService.deleteOwnerById(
          request.params.ownerId
        );
        if (err){
          return h.response(err).code(err.code);
        }
        return { data: students };
      },
    },
  },
];
