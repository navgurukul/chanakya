const { Model } = require("./helpers");
const Joi = require("joi");

module.exports = class InteviewTopic extends Model {
  static get tableName() {
    return "interview_topic";
  }
  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string(),
      created_at: Joi.date(),
    });
  }
  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
