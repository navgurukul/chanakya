const Joi = require('joi');
const logger = require('../../server/logger');

module.exports = [
  {
    method: 'POST',
    path: '/partners/emailreport',
    options: {
      description: 'Create a new emailreport.',
      tags: ['api'],
      validate: {
        payload: Joi.object({
          partner_id: Joi.number().integer().greater(0),
          emails: Joi.array(),
          repeat: Joi.string(),
          status: Joi.boolean(),
          report: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { emailReportService } = request.services();

        const students = await emailReportService.create(request.payload);
        logger.info('Create a new emailreport.');
        return { data: students };
      },
    },
  },
  {
    method: 'PUT',
    path: '/partners/emailreport/{emailreportId}',
    options: {
      description: 'Update a emailreport by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          emailreportId: Joi.number().integer(),
        }),
        payload: Joi.object({
          partner_id: Joi.number().integer().greater(0),
          emails: Joi.array(),
          repeat: Joi.string(),
          status: Joi.boolean(),
          report: Joi.string(),
        }),
      },
      handler: async (request) => {
        const { emailReportService } = request.services();

        const students = await emailReportService.updateById(
          request.payload,
          request.params.emailreportId
        );
        logger.info('Update a emailreport by id.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/emailreport',
    options: {
      description: 'Get all email reports.',
      tags: ['api'],
      handler: async (request) => {
        const { emailReportService } = request.services();
        const students = await emailReportService.findall();
        logger.info('Get all email reports.');
        return { data: students };
      },
    },
  },
  {
    method: 'GET',
    path: '/emailreport/send/partner/{partnerId}',
    options: {
      description: 'Send the email report to the specified partne.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        console.log('sending route:::::::');
        const { emailReportService } = request.services();
        const data = await emailReportService.sendEmailByPartnerId(
          request.params.partnerId
        );
        logger.info('Send the email report to the specified partne.');
        return data;
      },
    },
  },
  {
    method: 'GET',
    path: '/partners/emailreport/{partnerId}',
    options: {
      description: 'Get emailreport by partnerId',
      tags: ['api'],
      validate: {
        params: Joi.object({
          partnerId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { emailReportService } = request.services();
        console.log('getting email report ..............');
        const reports = await emailReportService.getEmailReportsById(
          request.params.partnerId
        );
        logger.info('Get emailreport by partnerId');
        return { data: reports };
      },
    },
  },
  {
    method: 'DELETE',
    path: '/partners/emailreport/{emailreportId}',
    options: {
      description: 'Delete emailreport by id.',
      tags: ['api'],
      validate: {
        params: Joi.object({
          emailreportId: Joi.number().integer(),
        }),
      },
      handler: async (request) => {
        const { emailReportService } = request.services();
        const students = await emailReportService.deleteById(
          request.params.emailreportId
        );
        logger.info('Delete emailreport by id.');
        return { data: students };
      },
    },
  },
];
