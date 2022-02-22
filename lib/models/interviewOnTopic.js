const { Model } = require("./helpers");
const Joi = require("joi");

module.exports = class InterviewOnTopic extends Model {
  static get tableName() {
    return "interview_on_topic";
  }
  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      interview_slot_id: Joi.number().integer(),
      inteview_topic_id: Joi.number().integer(),
      created_at: Joi.date(),
    });
  }
  static get relationMappings() {
    const InteviewTopic = require("./interviewTopic");
    const InterviewSlot = require("./interviewSlot");
    return {
      slot: {
        relation: Model.BelongsToOneRelation,
        modelClass: InterviewSlot,
        join: {
          from: "interview_on_topic.interview_slot_id",
          to: "interview_slot.id",
        },
      },
      topic: {
        relation: Model.BelongsToOneRelation,
        modelClass: InteviewTopic,
        join: {
          from: "interview_on_topic.inteview_topic_id",
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
