'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class QuestionSet extends Schwifty.Model {

    static get tableName() {
        return 'question_sets';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            questionIds: Joi.array().items(Joi.number().integer().greater(0)),
            enrolmentKeyId: Joi.number().integer().greater(0),
            createdAt: Joi.date()
        });
    }

    static get relationMappings() {
        const EnrolmentKey = require("./enrolmentKey");

        return {
            enrolmentKey: {
                relation: Model.BelongsToOneRelation,
                modelClass: EnrolmentKey,
                join: {
                    from: 'enrolment_keys.id',
                    to: 'question_sets.enrolmentKeyId'
                }
            }
        }
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
};
