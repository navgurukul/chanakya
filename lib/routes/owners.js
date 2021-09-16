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
          user_id: Joi.number().integer().greater(-1),
          name: Joi.string(),
          available: Joi.string().valid(["YES", "NO"]),
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
          name: Joi.string(),
          available: Joi.string().valid(["YES", "NO"]),
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
      handler: async (request) => {
        const { ownersService } = request.services();

        const students = await ownersService.findall();
        return { data: students };
      },
    },
  },
];
