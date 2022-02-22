const { Model } = require("./helpers");
const Joi = require("joi");

module.exports = class SlotBooked extends Model {
  static get tableName() {
    return "slot_booked";
  }
  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      interview_slot_id: Joi.number().integer(),
      interview_topic_id: Joi.number().integer(),
      created_at: Joi.date(),
    });
  }
  static get relationMappings() {
    const InterviewTopic = require("./interviewTopic");
    const InterviewSlot = require("./interviewSlot");
    return {
      interviewSlot: {
        relation: Model.BelongsToOneRelation,
        modelClass: InterviewSlot,
        join: {
          from: "slot_booked.interview_slot_id",
          to: "interview_slot.id",
        },
      },
      interviewTopic: {
        relation: Model.BelongsToOneRelation,
        modelClass: InterviewTopic,
        join: {
          from: "slot_booked.interview_topic_id",
          to: "interview_topic.id",
        },
      },
    };
  }
  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
