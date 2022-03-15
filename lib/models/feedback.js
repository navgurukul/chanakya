const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');

module.exports = class Feedback extends Model {
  static get tableName() {
    return 'feedbacks';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0),
      user_id: Joi.number().integer().greater(0),
      student_stage: Joi.string(),
      feedback: Joi.string().allow(''),
      state: Joi.string().allow(null, ''),
      who_assign: Joi.string(),
      to_assign: Joi.string(),
      audio_recording: Joi.string(),
      deadline_at: Joi.date(),
      finished_at: Joi.date(),
      last_updated: Joi.date(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student'),
        join: {
          from: 'feedbacks.student_id',
          to: 'students.id',
        },
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'user'),
        join: {
          from: 'feedbacks.user_id',
          to: 'c_users.id',
        },
      },
      assignUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'user'),
        join: {
          from: 'feedbacks.to_assign',
          to: 'c_users.mail_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
