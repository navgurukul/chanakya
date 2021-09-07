// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class Users extends Model {
  static get tableName() {
    return 'c_users';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      mobile: Joi.string().length(10),
      user_name: Joi.string(),
      mail_id: Joi.string(),
      email: Joi.string(),
      password: Joi.binary(),
      profile_pic: Joi.string(),
      google_user_id: Joi.string(),
      created_at: Joi.date(),
      partner_id: Joi.number().integer().optional(),
    });
  }

  static get relationMappings() {
    /* eslint-disable global-require */
    const UserRole = require('./userRole');
    /* eslint-enable global-require */

    return {
      roles: {
        relation: Model.HasManyRelation,
        modelClass: UserRole,
        join: {
          from: 'c_users.id',
          to: 'main.chanakya_user_roles.user_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
