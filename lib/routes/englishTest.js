'use strict';
const Joi = require('joi');
const Boom = require('boom');
const CONSTANTS = require('../constants');
const _ = require("underscore");

const EnglishQuestion = require('../models/englishQuestions');
const EnglishPassage = require('../models/englishPassage');
const EnrolmentKey = require('../models/enrolmentKey')
const EnglishOptions  = require('../models/englishOption');

const internals = {};

// helper method
internals.validateEnrolmentKey = async function(assessmentService, key) {
    let enrolmentKey = await assessmentService.validateEnrolmentKey(key);
    if (!enrolmentKey) {
        throw Boom.badRequest("The Enrolment Key specified is wrong. Please check and try again.");
    }
    return enrolmentKey;
}
internals.ensureEnrolmentKeyStatus = async function(englishTestServices, key) {
    let keyStatus = await englishTestServices.getEnrolmentKeyStatus(key);
    if (keyStatus.keyStatus == 'testAnswered') {
        throw Boom.conflict("This enrolment key has already been used to answer a test.");
    }
    return keyStatus.keyStatus;
}

module.exports = [
    {
        method: "POST",
        path: '/englishTest/questions',
        options: {
            description: "add english test questions and options in db",
            tags: ['api'],
            validate: {
                payload: {
                    question:EnglishQuestion.field('question'),
                    options: Joi.array().items(Joi.object({
                        text: Joi.string().required(),
                        correct: EnglishOptions.field('correct')
                    }).min(1)),
                    passageId: EnglishQuestion.field('passageId'),
                    type: EnglishQuestion.field('type')
                }
            },
            
            handler: async (request, h) => {
                const { englishTestServices } = request.services();
                let addAllQuestions = await englishTestServices.addQuestions(request.payload);
                let addAllOptions = await englishTestServices.addAllOptions(request.payload, addAllQuestions.id);

                return {
                    question: addAllQuestions,
                    options: addAllOptions
                }
            }
        }

    },
    {
        method: 'POST',
        path: '/englishTest/passages',
        options: {
            description: 'Add english passage for English test.',
            tags: ['api'],
            validate: {
                payload: {
                    passage: EnglishPassage.field("passage")
                }
            },
            handler: async (request, h ) => {
                const { englishTestServices } = request.services();
                let data = await englishTestServices.addPassage(request.payload);
                return {
                    data: data
                }
            }

        }
    },
    {
        method: "PUT",
        path: '/englishTest/question/{questionId}',
        options: {
            description: "Update the questions passing question Id.",
            tags: ['api'],
            validate: {
                params: {
                    questionId: EnglishQuestion.field('id')
                },
                payload: {
                    question:EnglishQuestion.field('question'),
                    options: Joi.array().items(Joi.object({
                        text: Joi.string().required(),
                        correct: EnglishOptions.field('correct')
                    }).min(1)),
                    passageId: EnglishQuestion.field('passageId'),
                    type: EnglishQuestion.field('type')
                }
            },
            handler: async (request, h) => {
                const { englishTestServices } = request.services();
                let response = await englishTestServices.UpdateQuationById(request.payload, request.params.questionId);
                return {
                    data: response
                }
            }
        }
    },

    {
        method: "PUT",
        path: '/englishTest/passage/{passageId}',
        options: {
            description: "update english passage passing passage Id",
            tags: ['api'],
            validate: {
                params: {
                    passageId: EnglishPassage.field('id')
                },
                payload: {
                    passage: EnglishPassage.field("passage")
                }
            },
            handler: async (request, h) => {
                const { englishTestServices } = request.services();
                let data = englishTestServices.updatePassages(request.payload, request.params.passageId);
                return {
                    data: data
                }
            }
        }
    },
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
    // {
    //     method: 'GET',
    //     path: '/englishTest/testing',
    //     options: {
    //         description: 'just for testing',
    //         tags:['api'],
    //         handler: async (request, h) => {
    //             const { englishTestServices } = request.services();
    //             let data = await englishTestServices._generateAssessmentQuestions();
    //             return {
    //                 data
    //             }
    //         }
    //     }
    // },
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