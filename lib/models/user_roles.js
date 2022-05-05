const Joi = require('joi');
const { Model } = require('./helpers');
const path = require('path');

module.exports = class UserRole extends Model {
  static get tableName() {
    return 'main.chanakya_user_roles';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      chanakya_user_email_id: Joi.number().integer(),
      roles: Joi.number().integer(),
      privilege: Joi.number().integer(),
    });
  }
  
  static get relationMappings() {
    return {
      access: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'access'),
        join: {
          from: 'main.chanakya_user_roles.id',
          to: 'main.chanakya_access.user_role_id',
        },
      },
      privileges: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'privilege'),
        join: {
          from: 'main.chanakya_user_roles.privilege',
          to: 'main.chanakya_privilege.id',
        },
      },
      role: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'rolebase'),
        join: {
          from: 'main.chanakya_user_roles.roles',
          to: 'main.chanakya_roles.id',
        },
      },
    }
  }
};
