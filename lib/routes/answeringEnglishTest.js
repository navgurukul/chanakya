'use strict';
const Joi = require('joi');
const CONSTANTS = require('../constants');
const _ = require("underscore");
const EnrolmentKey = require('../models/enrolmentKey')

module.exports = [
    {
        method: 'POST',
        path: '/englishTest/questions/{enrolment_key}/answers',
        options: {
            description: 'Saves the answers given by the student. Saves the end time of the test',
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                params:{
                    enrolment_key: EnrolmentKey.field("key")
                },
                payload: Joi.object()
            },
            handler: async (request, h) => {
                const { englishTestServices, assessmentService } = request.services();

                // swap empty strings with nulls
                let payload = _.object( _.map(_.pairs(request.payload), (x) => {
                    return [ x[0], x[1] == "" ? null : x[1] ]
                }));

                let enrolmentKey = await assessmentService.validateEnrolmentKey(request.params.enrolment_key);
                let key = await englishTestServices.getEnrolmentKeyStatus(enrolmentKey);
                let recoderAnswered = await englishTestServices.recordStudentAnswers(key.key, payload);                
                if (recoderAnswered) {
                    await assessmentService.patchStudentDetails(enrolmentKey, {
                        stage: "EnglisgTestCompleted"
                    });
                }
                
                return { success: true };
            }
        }
    },
    {
        method: 'GET',
        path: '/englishTest/validate_enrolment_key/{enrolmentKey}',
        options: {
            description: "Validates the given enrolment key.",
            tags: ['api'],
            validate: {
                params: {
                    enrolmentKey: EnrolmentKey.field("key")
                }
            },
            handler: async (request, h) => {
                const { assessmentService, englishTestServices } = request.services();

                let enrolmentKey = await assessmentService.validateEnrolmentKey(request.params.enrolmentKey);
                let keyStatus = await englishTestServices.getEnrolmentKeyStatus(enrolmentKey);
                if (enrolmentKey) {
                    return { valid: true, keyStatus: keyStatus.keystatus, stage: enrolmentKey.student.stage }
                } else {
                    return { valid: false, keyStatus: keyStatus.keyStatus }
                }
            }
        }
    },
    {
        method: "POST",
        path: '/englishTest/questions/{enrolment_key}',
        options: {
            description: 'Get the questions And passage associated with the given enrolment key. Starts the timer of the alloted time for the test.',
            tags:['api'],
            validate: {
                params: {
                    enrolment_key: EnrolmentKey.field("key")
                }
            },
            handler: async (request, h) => {
                const { assessmentService, englishTestServices } = request.services();
                let enrolmentKey = await  assessmentService.validateEnrolmentKey(request.params.enrolment_key);
                
                let key = await englishTestServices.getEnrolmentKeyStatus(enrolmentKey);
                
                let questions = await englishTestServices.getQuestionSetForEnrolmentKey(key.key);
                
                console.log( _.map(questions.questions, q => q.id) );
                
                return {
                    'data': questions,
                    'availableTime': CONSTANTS.questions.timeAllowed
                }
            }
        }
    }
]