const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');
const CONSTANTS = require('../constants');

module.exports = class IncomingCall extends Model {
  static get tableName() {
    return 'incoming_calls';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      contact_id: Joi.number().integer().greater(0).required(),
      call_type: Joi.string()
        .valid(...CONSTANTS.incomingCallType)
        .required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      contact: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'studentContact'),
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
