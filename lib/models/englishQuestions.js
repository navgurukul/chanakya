'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require("underscore");
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class EnglishQuestion extends Model {

    static get tableName() {

        return 'english_questions';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            question: Joi.string().required(),
            passageId: Joi.number().integer().greater(0).required(),
            type: Joi.number().valid( ..._.values(CONSTANTS.questions.types) ).required(), // 1 - mcq, 2 - integer
            createdAt: Joi.date()
        });
    }

    static get relationMappings() {
        const QuestionOption = require('./englishOption');

        return {
            options: {
                relation: Model.HasManyRelation,
                modelClass: QuestionOption,
                join: {
                    from: 'english_questions.id',
                    to: 'english_options.questionId'
                }
            }
        }
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
}