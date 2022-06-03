const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class Access extends Model {
  static get tableName() {
    return 'main.chanakya_access';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      user_role_id: Joi.number().integer(),
      access: Joi.number().integer(),
    });
  }
};
