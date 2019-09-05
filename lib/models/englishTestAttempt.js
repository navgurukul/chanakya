'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class EnglishQuestionAttempt extends Model {

    static get tableName() {
        return 'englishQuestion_attempts';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            enrolmentKeyId: Joi.number().integer().greater(0).required(),
            questionId: Joi.number().integer().greater(0).required(),
            selectedOptionId: Joi.number().integer().greater(0).allow(null),
            createdAt: Joi.date()
        });
    }

    static get relationMappings() {
        const EnrolmentKey = require("./enrolmentKey");
        const EnglishQuestion = require("./englishQuestions");
        const EnglishQuestionOption = require("./englishOption")

        return {
            enrolmentKey: {
                relation: Model.BelongsToOneRelation,
                modelClass: EnrolmentKey,
                join: {
                    from: 'enrolment_keys.id',
                    to: 'englishQuestion_attempts.enrolmentKeyId'
                }
            },
            question: {
                relation: Model.BelongsToOneRelation,
                modelClass: EnglishQuestion,
                join: {
                    from: 'english_questions.id',
                    to: 'englishQuestion_attempts.questionId'
                }
            },
            selectedOption: {
                relation: Model.BelongsToOneRelation,
                modelClass: EnglishQuestionOption,
                join: {
                    from: 'english_options.id',
                    to: 'englishQuestion_attempts.selectedOptionId'
                }
            }
        }
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
};
