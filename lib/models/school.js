const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class School extends Model {
  static get tableName() {
    return 'main.school';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string(),
    });
  }
};
