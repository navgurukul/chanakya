const Joi = require('joi');
const Boom = require('boom');
// const _ = require('lodash');
// const Student = require('../models/student');
const CONSTANTS = require('../constants');
const logger = require('../../server/logger');


module.exports = [
    {
        method: 'POST',
        path: '/student/sendSmsWhenSendOfferLeterToStudents/{studentId}',
        options: {
            description: 'send SMS When The Students Gets OfferLetter.',
            tags: ['api'],
            validate: {
                params: Joi.object({
                    studentId: Joi.number().integer().required(),
                }),
            },
            handler: async (request) => {
                const { sendingSmsToStudents } = request.services();
                const stage = await sendingSmsToStudents.getStage(request.params.studentId)
                if (stage == 'offerLetterSent') {
                    const smsData = await sendingSmsToStudents.prepareSmsTemplate(request.params.studentId);
                    const smsSend = await sendingSmsToStudents.sendSmsToStudents(smsData, request.params.studentId)
                    logger.info('send SMS When The Students Gets OfferLetter.');
                    return { message: 'SMS sent successfully!' };
                } else {
                    logger.error('Invalid stage for sending SMS: ' + stage);
                    throw Boom.badRequest('Invalid stage for sending SMS.');
                }
            },
        },
    },
]