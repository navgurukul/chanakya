const { Model } = require("./helpers");
const Joi = require("joi");
module.exports = class OwnerSchedule extends Model {
  static getTableName() {
    return "owner_schedule";
  }
  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      owner_id: Joi.number().integer(),
      from: Joi.date().timestamp(),
      to: Joi.date().timestamp(),
      created_at: Joi.date(),
    });
  }
  static get relationMappings() {
    const Owner = require("./owners");
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Owner,
        join: {
          from: "owner_schedule.owner_id",
          to: "interview_owners.id",
        },
      },
    };
  }
  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
