const Joi = require('joi');

module.exports = [
  {
    method: 'POST',
    path: '/ownershedule',
    options: {
      description: 'create a new schedule for the owner',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          owner_id: Joi.number().integer(),
          from: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
          to: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
        }),
      },
      handler: async (request) => {
        const { ownerScheduleService } = request.services();
        const data = await ownerScheduleService.create(request.payload);

        return { data };
      },
    },
  },
  {
    method: 'GET',
    path: '/ownershedule',
    options: {
      description: 'Get all sheduled owners.',
      tags: ['api'],
      handler: async (request) => {
        const { ownerScheduleService } = request.services();
        const data = await ownerScheduleService.get();

        return { data };
      },
    },
  },
  {
    method: 'GET',
    path: '/ownershedule/{id}',
    options: {
      description: 'Get sheduled owners by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        console.log('id', request.params.id);
        const { ownerScheduleService } = request.services();
        const data = await ownerScheduleService.getById(request.params.id);

        return { data };
      },
    },
  },
  {
    method: 'PUT',
    path: '/ownershedule/{owner_id}',
    options: {
      description: 'Upadte the owner schedule',
      tags: ['api'],
      validate: {
        params: Joi.object({
          owner_id: Joi.number().integer(),
        }),
        payload: Joi.object({
          from: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
          to: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
        }),
      },
      handler: async (request) => {
        const { ownerScheduleService } = request.services();
        const data = await ownerScheduleService.update(
          request.params.owner_id,
          request.payload
        );
        return { data };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/ownershedule/{id}',
    options: {
      description: 'Create a new partner.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          id: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { ownerScheduleService } = request.services();
        const data = await ownerScheduleService.delete(request.params.id);
        return { data };
      },
    },
  },
];
