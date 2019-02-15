'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class IncomingCall extends Model {

    static get tableName() {
        return 'incoming_calls';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            contactId: Joi.number().integer().greater(0).required(),
            callType: Joi.string().valid(...CONSTANTS.incomingCallType).required(),
            createdAt: Joi.date()
        });

    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
};
