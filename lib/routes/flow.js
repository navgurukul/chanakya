'use strict';
const Joi = require('joi');
const Boom = require('boom');
const IncomingCall = require('../models/incomingCall');

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
            tags: ['api'],
            handler: async (request, h) => {
                return {'sucess': true}
            }
        }
    }
]);
