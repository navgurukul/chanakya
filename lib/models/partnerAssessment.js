'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class PartnerAssessment extends Model {

    static get tableName() {
        return 'partner_assessments';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            name: Joi.string().required(),
            answerKeyUrl: Joi.string(),
            assessmentUrl: Joi.string(),
            questionSetId: Joi.number().integer().greater(0).required(),
            partnerId: Joi.number().integer().greater(0).required(),
            createdAt: Joi.date()
        });
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
};
