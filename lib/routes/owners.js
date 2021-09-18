const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: "POST",
    path: "/owner",
    options: {
      description: "create a new owner.",
      tags: ["api"],
      validate: {
        payload: {
          user_id: Joi.number().integer().greater(0),
          available: Joi.boolean(),
          max_limit: Joi.number().integer().greater(0),
          type: Joi.array().items([
            "EnglishInterview",
            "AlgebraInterview",
            "CultureFitInterview",
          ]),
        },
      },
      handler: async (request) => {
        const { ownersService } = request.services();

        const students = await ownersService.newOwner(request.payload);
        return { data: students };
      },
    },
  },
  {
    method: "PUT",
    path: "/owner/{ownerId}",
    options: {
      description: "update a owner by id.",
      tags: ["api"],
      validate: {
        params: {
          ownerId: Joi.number().integer(),
        },
        payload: {
          available: Joi.boolean(),
          max_limit: Joi.number().integer().greater(0),
          type: Joi.array().items([
            "EnglishInterview",
            "AlgebraInterview",
            "CultureFitInterview",
          ]),
        },
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
    method: "GET",
    path: "/owner",
    options: {
      description: "get all owners.",
      tags: ["api"],
      validate: {
        query: {
          available: Joi.boolean(),
        },
      },
      handler: async (request) => {
        const { ownersService } = request.services();
        const students = await ownersService.findall(request.query);
        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/owner/{ownerId}",
    options: {
      description: "get owner by id.",
      tags: ["api"],
      validate: {
        params: {
          ownerId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { ownersService } = request.services();
        const students = await ownersService.findById(request.params.ownerId);
        return { data: students };
      },
    },
  },
];