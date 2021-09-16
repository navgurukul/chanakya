// const Schwifty = require('schwifty');
const Joi = require("joi");
const _ = require("underscore");
const { Model } = require("./helpers");
const CONSTANTS = require("../constants");

module.exports = class Owners extends Model {
  static get tableName() {
    return "owners";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      user_id: Joi.number().integer().greater(0),
      name: Joi.string(),
      available: Joi.string(),
      pending_interview_count: Joi.number().integer(),
      createdOrUpdated_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const User = require("./user");
    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: "owners.user_id",
          to: "c_users.id",
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdOrUpdated_at = now;
    this.pending_interview_count = 1;
  }

  $beforeUpdate() {
    const now = new Date();
    this.createdOrUpdated_at = now;
  }
};
