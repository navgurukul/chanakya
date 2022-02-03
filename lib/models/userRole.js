const Joi = require("@hapi/joi");
const _ = require("lodash");
const CONSTANTS = require("../constants");
const { Model } = require("./helpers");

module.exports = class UserRole extends Model {
  static get tableName() {
    return "main.chanakya_user_roles";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      user_id: Joi.number().integer().greater(0).required(),
      role: Joi.string()
        .valid(..._.values(CONSTANTS.roles.all))
        .required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    // eslint-disable-next-line global-require
    const User = require("./user");

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: "main.chanakya_user_roles.user_id",
          to: "c_users.id",
        },
      },
    };
  }

  async $beforeInsert() {
    await super.$beforeInsert();
    const now = new Date();
    this.created_at = now;
  }
};
