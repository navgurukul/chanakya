const CONSTANTS = require("../constants");
const Joi = require("joi");
module.exports = [
  {
    method: "POST",
    path: "/partners/emailreport",
    options: {
      description: "create a new emailreport.",
      tags: ["api"],
      validate: {
        payload: {
          partner_id: Joi.number().integer().greater(0),
          emails: Joi.array(),
          repeat: Joi.string(),
          status: Joi.boolean(),
          report: Joi.string(),
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
    path: "/partners/emailreport/{emailreportId}",
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
          status: Joi.boolean(),
          report: Joi.string(),
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
    path: "/partners/emailreport",
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
    method: "GET",
    path: "/emailreport/send/partner/{partnerId}",
    options: {
      description: "send the email report to the specified partne.",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        console.log("sending route:::::::");
        const { emailReportService } = request.services();
        const data = await emailReportService.sendEmailByPartnerId(
          request.params.partnerId
        );
        return data;
      },
    },
  },
  {
    method: "GET",
    path: "/partners/emailreport/{partnerId}",
    options: {
      description: "Get emailreport by partnerId",
      tags: ["api"],
      validate: {
        params: {
          partnerId: Joi.number().integer(),
        },
      },
      handler: async (request) => {
        const { emailReportService } = request.services();
        console.log("getting email report ..............");
        const reports = await emailReportService.getEmailReportsById(
          request.params.partnerId
        );
        return { data: reports };
      },
    },
  },
  {
    method: "DELETE",
    path: "/partners/emailreport/{emailreportId}",
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
