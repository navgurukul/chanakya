
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');


module.exports = class Contact extends Model {
  static get tableName() {
    return 'contacts';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      studentId: Joi.number().integer().greater(0).required(),
      mobile: Joi.string().length(10).required(),
      isWhatsapp: Joi.boolean().default(false),
      createdAt: Joi.date(),
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
          from: 'contacts.studentId',
          to: 'students.id',
        },
      },
      incomingCalls: {
        relation: Model.HasManyRelation,
        modelClass: IncomingCall,
        join: {
          from: 'contacts.id',
          to: 'incoming_calls.contactId',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
