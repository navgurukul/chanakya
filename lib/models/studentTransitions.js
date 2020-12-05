// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class StageTransition extends Model {
  static get tableName() {
    return 'stage_transitions';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      from_stage: Joi.string().valid(CONSTANTS.studentStages),
      to_stage: Joi.string().valid(CONSTANTS.studentStages).required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const Student = require('./student');
    const Feedback = require('./feedback');
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: Student,
        join: {
          from: 'stage_transitions.student_id',
          to: 'students.id',
        },
      },
      feedbacks: {
        relation: Model.BelongsToOneRelation,
        modelClass: Feedback,
        join: {
          from: ['stage_transitions.student_id', 'stage_transitions.to_stage'],
          to: ['feedbacks.student_id', 'feedbacks.student_stage'],
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
