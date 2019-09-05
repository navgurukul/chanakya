'use strict';
const Joi = require('joi');
const Question = require('../models/question');
const QuestionOption = require('../models/questionOption');

const englishQuestion = require('../models/englishQuestions')
const englishOption = require('../models/englishOption')

exports.bucketChoiceSchema = Joi.object({
    file: Joi.string().required(),
    id: Joi.number().integer().greater(0).allow(null).required()
})

exports.bucketSchema = Joi.object({
    name: Joi.string().required(),
    id: Joi.number().integer().greater(0).allow(null).required(),
    numQuestions: Joi.number().greater(0).required(),
    choices: Joi.array().min(1).items(exports.bucketChoiceSchema)
})

exports.configSchema = Joi.object({
    buckets: Joi.array().min(1).items(exports.bucketSchema).required(),
    normalQuestionFiles: Joi.array().min(1).items(Joi.string().required()).required()
})

exports.questionAttrs = Joi.object({
    difficulty: Question.field("difficulty"),
    topic: Question.field("topic"),
    type: Question.field("type"),
    id: QuestionOption.field("id").allow(null),
    correctOption: Joi.number().integer().required().greater(0)
});

// Schema for English  Test.
exports.passageSchema = Joi.object({
    passage: Joi.string().required(),
    passageQuestion: Joi.string().required()
})

exports.configSchemaForEnglish = Joi.object({
    pasaages: Joi.array().min(1).items(exports.passageSchema)
})

exports.englishQuestionAttrs = Joi.object({
    question: englishQuestion.field('question'),
    passageId: englishQuestion.field('passageId'),
    type: englishQuestion.field('type') 
})