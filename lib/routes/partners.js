
const Joi = require('joi');
const Partner = require('../models/partner');

const internals = {};
internals.partnerSchema = Joi.object({
  name: Partner.field('name').required(),
  notes: Partner.field('notes'),
});

module.exports = [
  {
    method: 'GET',
    path: '/partners',
    options: {
      description: 'List of all partners in the system.',
      tags: ['api'],
      handler: async (request, h) => {
        const { partnerService } = request.services();

        const partners = await partnerService.findAll();
        return { data: partners };
      },
    },
  },
  {
    method: 'POST',
    path: '/partners',
    options: {
      description: 'Create a new partner.',
      tags: ['api'],
      validate: {
        payload: internals.partnerSchema,
      },
      handler: async (request, h) => {
        const { partnerService } = request.services();

        const partner = await partnerService.create(request.payload);
        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/{partnerId}',
    options: {
      description: 'Get partner details with the given ID.',
      tags: ['api'],
      validate: {
        params: {
          partnerId: Partner.field('id'),
        },
      },
      handler: async (request, h) => {
        const { partnerService } = request.services();

        const partner = await partnerService.findById(request.params.partnerId);
        return { data: partner };
      },
    },
  },
  {
    method: 'PUT',
    path: '/partners/{partnerId}',
    options: {
      description: 'Edit partner details with the given ID.',
      tags: ['api'],
      validate: {
        params: {
          partnerId: Partner.field('id'),
        },
        payload: internals.partnerSchema,
      },
      handler: async (request, h) => {
        const { partnerService } = request.services();

        const partner = await partnerService.findById(request.params.partnerId);
        await partnerService.update(request.params.partnerId, request.payload);

        return { data: partner };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/{partnerId}/students',
    options: {
      description: 'Get all the students of a given partner',
      tags: ['api'],
      validate: {
        params: {
          partnerId: Partner.field('id'),
        },
      },
      handler: async (request, h) => {
        const { studentService, partnerService } = request.services();

        const partner = await partnerService.findById(request.params.partnerId);

        const students = await studentService.findAllByPartner(partner.id);

        return { data: students };
      },
    },
  },
];
