const Joi = require("joi");
const Boom = require("boom");
module.exports = [
  //TODO: get put ,post,delete
  {
    method: "POST",
    path: "/redflag/{studentId}",
    options: {
      description: "Raise red flags for incorrect student details",
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

        return data;
      },
    },
  },
  {
    method: "PUT",
    path: "/redflag/{studentId}",
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
    path: "/redflag/{studentId}",
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
        return data;
      },
    },
  },
  {
    method: "GET",
    path: "/redflags",
    options: {
      description: "Get all the flags raised ",
      tags: ["api"],
      handler: async (request) => {
        const { dashboardFlagServcies } = request.services();
        const data = await dashboardFlagServcies.getAll();
        return data;
      },
    },
  },
  {
    method: "DELETE",
    path: "/redflag/{studentId}",
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
