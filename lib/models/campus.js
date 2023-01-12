const Joi = require('joi');
const { Model } = require('./helpers/index');

module.exports = class Campus extends Model {
  static get tableName() {
    return 'campus';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      campus: Joi.string(),
      address:Joi.string(),
    });
  }
};
