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

    static get relationMappings() {
        const Contact = require('./studentContact');

        return {
            contact: {
                relation: Model.BelongsToOneRelation,
                modelClass: Contact,
                join: {
                    from: 'incoming_calls.contactId',
                    to: 'contacts.id'
                }
            }
        }
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
};
