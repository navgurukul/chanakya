const Joi = require('joi');
const _ = require('underscore');
const Boom = require('boom');
const { Readable } = require('stream');
const moment = require('moment');
const Partner = require('../models/partner');
const IncomingCall = require('../models/incomingCall');
const Helpers = require('../helpers');

module.exports = () => ([
  {
    method: 'GET',
    path: '/helpline/register_exotel_call',
    options: {
      description: 'Exotel passthru will ping this endpoint to register a call.',
      tags: ['api'],
      validate: {
        options: {
          allowUnknown: true,
        },
        query: {
          ngCallType: IncomingCall.field('call_type').required(),
          From: Joi.string().required(),
          partner_id: Partner.field('id'),
        },
      },
      handler: async (request) => {
        // validate if the number provided is a mobile number
        const mobile = request.query.From.substr(1);
        const { partner_id } = request.query;
        if (mobile.length !== 10) {
          return Boom.badRequest('A valid mobile number was not present in the From parameter.');
        }

        const { studentService, exotelService } = request.services();

        if (request.query.ngCallType === 'requestCallback') {
          // contact linked to the most most recent student
          const contact = await studentService.findOneByContact(mobile, true);
          if (contact) {
            await studentService.addIncomingCall(request.query.ngCallType, contact);
          } else {
            await studentService.create('requestCallback', 'requestCallback', { mobile });
          }
          await exotelService.sendSMS(mobile, 'requestCallback'); // smsResponse
        } else if (request.query.ngCallType === 'getEnrolmentKey') {
          const key = await studentService.sendEnrolmentKey({ mobile, partner_id });
          return {
            success: true,
            key: key.key,
          };
        }
        return { success: true };
      },
    },
  },
  {
    method: 'POST',
    path: '/general/upload_file/{uploadType}',
    options: {
      description: 'Upload file to S3. Upload type like assessment CSV or question images need to be specified.',
      payload: {
        output: 'stream',
        parse: true,
        maxBytes: 2 * 10000 * 10000,
        allow: 'multipart/form-data',
      },
      tags: ['api'],
      validate: {
        params: {
          uploadType: Joi.string().valid('answerCSV', 'questionImage', 'audio_recording'),
        },
        payload: {
          file: Joi.object().type(Readable).required().meta({ swaggerType: 'file' }),
        },
      },
      plugins: {
        'hapi-swagger': { payloadType: 'form' },
      },
      handler: async (request) => {
        const fileS3URL = await Helpers.uploadToS3(request.payload.file, request.params.uploadType);
        return { fileUrl: fileS3URL };
      },
    },
  },
  {
    method: 'GET',
    path: '/general/metrics',
    options: {
      description: 'Get Metrics report for a date range',
      tags: ['api'],
      validate: {
        query: {
          startDate: Joi.date().required(),
          endDate: Joi.date().required(),
          metricsName: Joi.string().required(),
        },
      },
      handler: async (request) => {
        const { metricsService } = request.services();

        // process start and end dates
        const startDate = moment(request.query.startDate, 'YYYY-MM-DD');
        const endDate = moment(request.query.endDate, 'YYYY-MM-DD');

        // process the metrics name param
        let metricsName = request.query.metricsName.split(',');
        metricsName = _.map(metricsName, (m) => m.trim());
        metricsName = _.filter(metricsName, (m) => {
          if (typeof m === 'string' && m.length > 0) {
            return m;
          }
          return null;
        });

        const allMetrics = await metricsService.getAllMetrics(startDate, endDate, metricsName);
        return allMetrics;
      },
    },
  },
]);
