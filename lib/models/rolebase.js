const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class Rolebase extends Model {
  static get tableName() {
    return 'main.chanakya_roles';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      email: Joi.string(),
      roles: Joi.array(),
      privilege: Joi.array(),
    });
  }
};
