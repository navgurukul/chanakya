const Joi = require("joi");
const { Model } = require("./helpers");

module.exports = class InterviewSlotResource extends Model {
  static get tableName() {
    return "interview_slot_resource";
  }
  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      owner_id: Joi.number().integer().greater(0),
      start_time: Joi.string(),
      end_time: Joi.string(),
      duration: Joi.string().default(null),
      date: Joi.string(),
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
          from: "interview_slot_resource.owner_id",
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
