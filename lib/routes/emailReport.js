const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: "POST",
    path: "/emailreport",
    options: {
      description: "create a new emailreport.",
      tags: ["api"],
      validate: {
        payload: {
          partner_id: Joi.number().integer().greater(0),
          emails: Joi.array(),
          repeat: Joi.string(),
        },
      },
      handler: async (request) => {
        const { emailReportService } = request.services();

        const students = await emailReportService.create(request.payload);
        return { data: students };
      },
    },
  },
  {
    method: "PUT",
    path: "/emailreport/{emailreportId}",
    options: {
      description: "update a emailreport by id.",
      tags: ["api"],
      validate: {
        params: {
          emailreportId: Joi.number().integer(),
        },
        payload: {
          partner_id: Joi.number().integer().greater(0),
          emails: Joi.array(),
          repeat: Joi.string(),
        },
      },
      handler: async (request) => {
        const { emailReportService } = request.services();

        const students = await emailReportService.updateById(
          request.payload,
          request.params.emailreportId
        );
        return { data: students };
      },
    },
  },
  {
    method: "GET",
    path: "/emailreport",
    options: {
      description: "get all email reports.",
      tags: ["api"],
      handler: async (request) => {
        const { emailReportService } = request.services();
        const students = await emailReportService.findall();
        return { data: students };
      },
    },
  },
  {
    method: "DELETE",
    path: "/emailreport/{emailreportId}",
    options: {
      description: "delete emailreport by id.",
      tags: ["api"],
      validate: {
        params: {
          emailreportId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { emailReportService } = request.services();
        const students = await emailReportService.deleteById(
          request.params.emailreportId
        );
        return { data: students };
      },
    },
  },
];
