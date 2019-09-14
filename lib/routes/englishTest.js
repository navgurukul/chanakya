'use strict';
const Joi = require('joi');
const _ = require("underscore");

const EnglishQuestion = require('../models/englishQuestions');
const EnglishPassage = require('../models/englishPassage');
const EnglishOptions  = require('../models/englishOption');

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
    }
]