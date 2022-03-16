const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class EmailReport extends Model {
  static get tableName() {
    return 'email_report';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      partner_id: Joi.number().integer().greater(0),
      emails: Joi.array(),
      repeat: Joi.string(),
      status: Joi.boolean(),
      report: Joi.string(),
    });
  }
};
