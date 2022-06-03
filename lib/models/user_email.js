const Joi = require('joi');
const { Model } = require('./helpers');
const path = require('path');

module.exports = class UserEmail extends Model {
  static get tableName() {
    return 'main.chanakya_user_email';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      email: Joi.string(),
    });
  }
  
  static get relationMappings() {
    return {
      userrole: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'user_roles'),
        join: {
          from: 'main.chanakya_user_email.id',
          to: 'main.chanakya_user_roles.chanakya_user_email_id',
        },
      },
    }
  }
};
