'use strict';
const Joi = require('joi');
const Boom = require('boom');
const Readable = require('stream').Readable;
const IncomingCall = require('../models/incomingCall');
const Helpers = require('../helpers');

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
                    ngCallType: IncomingCall.field('callType'),
                    From: Joi.string().required()
                }
            },
            handler: async (request, h) => {
                // validate if the number provided is a mobile number
                let mobile = request.query.From.substr(1);
                if (mobile.length != 10){
                    return Boom.badRequest("A valid mobile number was not present in the From parameter.");
                }

                const { studentService } = request.services();

                if (request.query.ngCallType == "requestCallback") {
                    let contact = await studentService.findOneByContact(mobile, true); // contact linked to the most most recent student
                    if(contact){
                        await studentService.addIncomingCall(request.query.ngCallType, contact);
                    } else {
                        await studentService.create(mobile, "requestCallback", "requestCallback");
                    }
                } else if (request.query.ngCallType == "getEnrolmentKey") {
                    await studentService.sendEnrolmentKey({mobile: mobile})
                }

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
    }
]);
