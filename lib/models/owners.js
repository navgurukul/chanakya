// const Schwifty = require('schwifty');
const Joi = require("joi");
const _ = require("underscore");
const { Model } = require("./helpers");
const CONSTANTS = require("../constants");

module.exports = class Owners extends Model {
  static get tableName() {
    return "interview_owners";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      gender: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.ownerDetails.gender)),
      user_id: Joi.number().integer().greater(0),
      available: Joi.boolean(),
      max_limit: Joi.number().integer().greater(0),
      type: Joi.string(),
      pending_interview_count: Joi.number().integer(),
    });
  }

  static get relationMappings() {
    const User = require("./user");
    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: User,
        join: {
          from: "interview_owners.user_id",
          to: "c_users.id",
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.pending_interview_count = 0;
  }

  $beforeUpdate() {
    const now = new Date();
  }
};
