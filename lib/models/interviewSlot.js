const Joi = require("joi");
const { Model } = require("./helpers");
// Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/) is regex HH:MM 24-hour format, optional leading 0
module.exports = class InterviewSlot extends Model {
  static get tableName() {
    return "interview_slot";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      owner_id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0),
      student_name: Joi.string(),
      transition_id: Joi.number().integer().greater(0),
      start_time: Joi.string().regex(
        /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
      ),
      end_time: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
      end_time_expected: Joi.string().regex(
        /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
      ),
      duration: Joi.string().default(null),
      on_date: Joi.date(),
      status: Joi.string().default(null),
      is_cancelled: Joi.boolean(),
      cancelltion_reason: Joi.string().default(null),
      created_at: Joi.date(),
    });
  }
  static get relationMappings() {
    const Student = require("./student");
    const Owner = require("./owners");
    const Transitions = require("./studentTransitions");
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: Student,
        join: {
          from: "interview_slot.student_id",
          to: "students.id",
        },
      },
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Owner,
        join: {
          from: "interview_slot.owner_id",
          to: "interview_owners.id",
        },
      },
      transitions: {
        relation: Model.BelongsToOneRelation,
        modelClass: Transitions,
        join: {
          from: "interview_slot.transition_id",
          to: "stage_transitions.id",
        },
      },
    };
  }
  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
