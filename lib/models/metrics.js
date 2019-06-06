'use strict';
const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const _ = require('underscore');
const CONSTANTS = require('../constants');

module.exports = class Metrics extends Model {

    static get tableName() {
        return 'metrics';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            gender:  Joi.number().integer().valid( ..._.values(CONSTANTS.studentDetails.gender) ).allow(null),
            metricName: Joi.string().required(),
            value: Joi.number().integer(),
            createdAt: Joi.date(),
            date: Joi.date(),
        });
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
};
