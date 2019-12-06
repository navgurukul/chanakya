
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
      studentId: Joi.number().integer().greater(0).required(),
      fromStage: Joi.string().valid(CONSTANTS.studentStages),
      toStage: Joi.string().valid(CONSTANTS.studentStages).required(),
      createdAt: Joi.date(),
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
          from: 'stage_transitions.studentId',
          to: 'students.id',
        },
      },
      feedback: {
        relation: Model.BelongsToOneRelation,
        modelClass: Feedback,
        join: {
          from: ['stage_transitions.studentId', 'stage_transitions.toStage'],
          to: ['feedbacks.studentId', 'feedbacks.student_stage'],
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
