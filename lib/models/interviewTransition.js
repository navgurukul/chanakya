const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');

module.exports = class Interview extends Model {
  static get tableName() {
    return 'interview_transition';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0),
      from_stage: Joi.string(),
      to_stage: Joi.string(),
      interviewer_feedback: Joi.string().allow(''),
      transition_done_by:Joi.string(),
      created_at: Joi.date(),
    });
  }
  static get relationMappings() {
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student'),
        join: {
          from: 'interview_transition.student_id',
          to: 'students.id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
