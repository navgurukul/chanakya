'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
// const CONSTANTS = require('../constants');

module.exports = class EnglishEnrolmentKey extends Model {

    static get tableName() {
        return 'englishEnrolment_keys';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            key: Joi.string().length(6).required(),
            startTime: Joi.date(),
            endTime: Joi.date(),
            totalMarks: Joi.number().integer(),
            passageId: Joi.number().integer().greater(0),
            createdAt: Joi.date(),
        });
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
    
};
