// const Schwifty = require('schwifty');
const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');
const CONSTANTS = require('../constants');

module.exports = class StageTransition extends Model {
  static get tableName() {
    return 'stage_transitions';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      from_stage: Joi.string()
        .valid(...CONSTANTS.studentStages)
        .allow(''),
      to_stage: Joi.string()
        .valid(...CONSTANTS.studentStages)
        .required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student'),
        join: {
          from: 'stage_transitions.student_id',
          to: 'students.id',
        },
      },
      feedbacks: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'feedback'),
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
