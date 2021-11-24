const Joi = require("joi");
const Boom = require("boom");
module.exports = [
  //TODO: get put ,post,delete
  {
    method: "POST",
    path: "/dashboardflag/{studentId}",
    options: {
      description: "Raise a flag for the dashboard errors",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
        payload: {
          flag: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { dashboardFlagServcies } = request.services();
        const data = await dashboardFlagServcies.create(
          request.params.studentId,
          request.payload.flag
        );
        if (!data) {
          throw Boom.badRequest("Please give feedback and try again.");
        }
        return data;
      },
    },
  },
  {
    method: "PUT",
    path: "/dashboardflag/{studentId}",
    options: {
      description: "update the  flag raised ",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
        payload: {
          flag: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { flag } = request.payload;
        const { dashboardFlagServcies } = request.services();

        const updatedFlag = flag
          ? await await dashboardFlagServcies.update(
              request.params.studentId,
              flag
            )
          : false;
        if (updatedFlag) {
          return { data: "Successfully Updated flag" };
        }
      },
    },
  },
  {
    method: "GET",
    path: "/dashboardflag/{studentId}",
    options: {
      description:
        "To get the information about the flag raised to the specified student",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
      },
      handler: async (request) => {
        const { dashboardFlagServcies } = request.services();
        const data = await dashboardFlagServcies.getById(
          request.params.studentId
        );
        if (!data) {
          throw Boom.badRequest("Please give feedback and try again.");
        }
        return data;
      },
    },
  },
  {
    method: "DELETE",
    path: "/dashboardflag/{studentId}",
    options: {
      description: "Deletes the flag raised with the given studentId",
      tags: ["api"],
      validate: {
        params: {
          studentId: Joi.number().integer().required(),
        },
      },
      handler: async (request) => {
        const { dashboardFlagServcies } = request.services();
        const data = await dashboardFlagServcies.delete(
          request.params.studentId
        );
        if (data) {
          return { success: true };
        } else return { error: "Unable to delete .." };
      },
    },
  },
];
