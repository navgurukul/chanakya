
// const Schwifty = require('schwifty');
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
      contact_id: Joi.number().integer().greater(0).required(),
      call_type: Joi.string().valid(...CONSTANTS.incomingcall_type).required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const Contact = require('./studentContact');

    return {
      contact: {
        relation: Model.BelongsToOneRelation,
        modelClass: Contact,
        join: {
          from: 'incoming_calls.contact_id',
          to: 'contacts.id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
