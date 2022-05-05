const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class Privilege extends Model {
  static get tableName() {
    return 'main.chanakya_privilege';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      privilege: Joi.string(),
    });
  }
};
