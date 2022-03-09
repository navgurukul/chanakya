// const Schwifty = require('schwifty');
const Joi = require("joi");
const _ = require("underscore");
const { Model } = require("./helpers");
const CONSTANTS = require("../constants");

module.exports = class Rolebase extends Model {
  static get tableName() {
    return "main.chanakya_roles";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      email: Joi.string(),
      roles: Joi.array(),
      privilege: Joi.array()
    });
  }

  static get relationMappings() {
//     const User = require("./user");
    return {
//       user: {
//         relation: Model.HasOneRelation,
//         modelClass: User,
//         join: {
//           from: "interview_owners.user_id",
//           to: "c_users.id",
//         },
//       },
    };
  }

//   $beforeInsert() {
//     const now = new Date();
//     this.pending_interview_count = 0;
//   }

//   $beforeUpdate() {
//     const now = new Date();
//   }
};
