'use strict';
const Joi = require('joi');
const _ = require('underscore');
const Boom = require('boom');
const Readable = require('stream').Readable;
const IncomingCall = require('../models/incomingCall');
const Helpers = require('../helpers');
const ChanakyaGSheetSync = require("../helpers/syncGSheet");
const ChanakyaPartnerSheetSync = require("../helpers/syncPartnerSheet");
const moment = require("moment");

module.exports = (server, options) => ([
    {
        method: 'GET',
        path: '/helpline/register_exotel_call',
        options: {
            description: "Exotel passthru will ping this endpoint to register a call.",
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                query: {
                    ngCallType: IncomingCall.field('callType').required(),
                    From: Joi.string().required()
                }
            },
            handler: async (request, h) => {
                // validate if the number provided is a mobile number
                let mobile = request.query.From.substr(1);
                if (mobile.length != 10){
                    return Boom.badRequest("A valid mobile number was not present in the From parameter.");
                }

                const { studentService, exotelService } = request.services();

                if (request.query.ngCallType == "requestCallback") {
                    let contact = await studentService.findOneByContact(mobile, true); // contact linked to the most most recent student
                    if(contact){
                        await studentService.addIncomingCall(request.query.ngCallType, contact);
                    } else {
                        await studentService.create("requestCallback", "requestCallback", {mobile: mobile});
                    }
                    let smsResponse = await exotelService.sendSMS(mobile, "requestCallback");
                } else if (request.query.ngCallType == "getEnrolmentKey") {
                    let key = await studentService.sendEnrolmentKey({mobile: mobile});
                    return {
                        success: true,
                        key: key.key
                    }
                }
                
                return {'success': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/general/syncWithGSheet',
        options: {
            description: "Syncs the entire DB with the google sheet. Currently this is a one way sync from our DB to the Spreadsheet.",
            tags: ['api'],
            handler: async (request, h) => {
                const services = request.services();
            
                let syncSheet = new ChanakyaGSheetSync(services);
                await syncSheet.init();
                await syncSheet.startSync();
                return {'success': true}
            }
        }
    },
    {
        method: 'GET',
        path: '/general/syncWithPartnerSheet',
        options: {
            description: "Syncs the entire DB with the google sheet. Currently this is a one way sync from our DB to the Spreadsheet.",
            tags: ['api'],
            handler: async (request, h) => {
                const { partnerService } = request.services();
            
                let syncPartnerSheet = new ChanakyaPartnerSheetSync(partnerService);
                await syncPartnerSheet.init();
                await syncPartnerSheet.startSync();
                return {'success': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/general/upload_file/{uploadType}',
        options: {
            description: "Upload file to S3. Upload type like assessment CSV or question images need to be specified.",
            payload: {
                output: 'stream',
                parse: true,
                maxBytes: 2 * 1000 * 1000,
                allow: 'multipart/form-data',
            },
            tags: ['api'],
            validate: {
                params: {
                    uploadType: Joi.string().valid("answerCSV", "questionImage")
                },
                payload: {
                    file: Joi.object().type(Readable).required().meta({ swaggerType: 'file' })
                }
            },
            plugins: {
                'hapi-swagger': { payloadType: 'form' }
            },
            handler: async (request, h) => {
                let fileS3URL = await Helpers.uploadToS3(request.payload.file, request.params.uploadType);
                return { 'fileUrl': fileS3URL };
            }
        }
    },
    {
        method: 'GET',
        path: '/general/metrics',
        options: {
            description: "Get Metrics report for a date range",
            tags: ['api'],
            validate: {
                query: {
                    startDate: Joi.date().required(),
                    endDate: Joi.date().required(),
                    metricsName: Joi.string().required()
                }
            },
            handler: async (request, h) => {
                const { metricsService } = request.services();

                // process start and end dates
                let startDate = moment(request.query.startDate, "YYYY-MM-DD");
                let endDate = moment(request.query.endDate, "YYYY-MM-DD");

                // process the metrics name param
                let metricsName = request.query.metricsName.split(',');
                metricsName = _.map(metricsName, (m) => m.trim());
                metricsName = _.filter(metricsName, (m) => {
                    if (typeof m == 'string' && m.length > 0) {
                        return m;
                    }
                });

                let allMetrics = await metricsService.getAllMetrics(startDate, endDate, metricsName);

                return allMetrics;

            }
        }
    }
]);
