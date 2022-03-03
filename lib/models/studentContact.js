// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class Contact extends Model {
  static get tableName() {
    return 'contacts';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      mobile: Joi.string().length(10).required(),
      is_whatsapp: Joi.boolean().default(false),
      contact_type: Joi.string()
        .valid(...CONSTANTS.contact_type)
        .default("primary"),
      alt_mobile: Joi.string().length(10),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const Student = require('./student');
    const IncomingCall = require('./incomingCall');
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: Student,
        join: {
          from: 'contacts.student_id',
          to: 'students.id',
        },
      },
      incomingCalls: {
        relation: Model.HasManyRelation,
        modelClass: IncomingCall,
        join: {
          from: 'contacts.id',
          to: 'incoming_calls.contact_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
