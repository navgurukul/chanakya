const Joi = require("joi");
const { Model } = require("./helpers");

module.exports = class StudentInterviewSlot extends Model {
  static get tableName() {
    return "student_interview_slot";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      owner_id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0),
      transition_id: Joi.number().integer().greater(0),
      duration: Joi.string().default(null),
      start_time: Joi.string(),
      end_time: Joi.string(),
      status: Joi.string().default(null),
      date: Joi.date(),
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
          from: "student_interview_slot.student_id",
          to: "students.id",
        },
      },
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Owner,
        join: {
          from: "student_interview_slot.owner_id",
          to: "interview_owners.id",
        },
      },
      transitions: {
        relation: Model.BelongsToOneRelation,
        modelClass: Transitions,
        join: {
          from: "student_interview_slot.transition_id",
          to: "stage_transitions.id",
        },
      },
    };
  }
};
