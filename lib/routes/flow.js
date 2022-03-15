const Joi = require('joi');
const _ = require('underscore');
const Boom = require('boom');
const moment = require('moment');
const Partner = require('../models/partner');
const IncomingCall = require('../models/incomingCall');
const Helpers = require('../helpers');

module.exports = () => [
  {
    method: 'GET',
    path: '/check_duplicate',
    options: {
      description: 'check if the name and number is already present.',
      tags: ['api'],
      validate: {
        query: Joi.object({
          Number: Joi.string().required(),
          Name: Joi.string().required(),
        }),
      },
      handler: async (request) => {
        const { studentService } = request.services();

        const duplicate = await studentService.markDuplicateOfSameStudent1(
          request.query.Number,
          request.query.Name
        );
        return { data: duplicate };
      },
    },
  },
  {
    method: 'GET',
    path: '/helpline/register_exotel_call',
    options: {
      description:
        'Exotel passthru will ping this endpoint to register a call.',
      tags: ['api'],
      validate: {
        options: Joi.object({
          allowUnknown: true,
        }),
        query: Joi.object({
          ngCallType: IncomingCall.field('call_type').required(),
          From: Joi.string().required(),
          partner_id: Partner.field('id'),
          student_id: Joi.number().integer().greater(0),
        }),
      },
      handler: async (request) => {
        // validate if the number provided is a mobile number
        const mobile = request.query.From.substr(1);
        console.log('mobile number ', mobile);
        const { partner_id, student_id } = request.query;
        if (mobile.length !== 10) {
          return Boom.badRequest(
            'A valid mobile number was not present in the From parameter.'
          );
        }

        const { studentService, exotelService } = request.services();

        if (request.query.ngCallType === 'requestCallback') {
          // contact linked to the most most recent student
          const contact = await studentService.findOneByContact(mobile, true);
          if (contact) {
            await studentService.addIncomingCall(
              request.query.ngCallType,
              contact
            );
          } else {
            await studentService.create('requestCallback', 'requestCallback', {
              mobile,
            });
          }
          await exotelService.sendSMS(mobile, 'requestCallback'); // smsResponse
        } else if (request.query.ngCallType === 'getEnrolmentKey') {
          const key = await studentService.sendEnrolmentKey({
            mobile,
            partner_id,
            student_id,
          });
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
      description:
        'Upload file to S3. Upload type like assessment CSV or question images need to be specified.',
      payload: {
        output: 'stream',
        parse: true,
        maxBytes: 2 * 10000 * 10000,
        allow: 'multipart/form-data',
      },
      tags: ['api'],
      validate: {
        params: Joi.object({
          uploadType: Joi.string().valid(
            'answerCSV',
            'questionImage',
            'audio_recording'
          ),
        }),
        payload: Joi.object({
          file: Joi.any(),
        }),
      },
      plugins: {
        'hapi-swagger': { payloadType: 'form' },
      },
      handler: async (request) => {
        const fileS3URL = await Helpers.uploadToS3(
          request.payload.file,
          request.params.uploadType
        );
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
        query: Joi.object({
          startDate: Joi.date().required(),
          endDate: Joi.date().required(),
          metricsName: Joi.string().required(),
        }),
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

        const allMetrics = await metricsService.getAllMetrics(
          startDate,
          endDate,
          metricsName
        );
        return allMetrics;
      },
    },
  },
];
