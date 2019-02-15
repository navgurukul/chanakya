'use strict';
const Joi = require('joi');
const Question = require('../models/question');
const QuestionOption = require('../models/questionOption');

exports.questionAttrs = Joi.object({
    difficulty: Question.field("difficulty"),
    topic: Question.field("topic"),
    type: Question.field("type")
});

exports.questionChoiceAttrs = Joi.object({
    id: QuestionOption.field("id").allow(null),
    correctOption: Joi.number().integer().required().greater(0)
});
