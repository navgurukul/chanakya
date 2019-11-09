
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class Feedback extends Model {
  static get tableName() {
    return 'feedbacks';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      studentId: Joi.number().integer().greater(0),
      userId: Joi.number().integer().greater(0),
      student_stage: Joi.string(),
      feedback_type: Joi.string().valid(...CONSTANTS.feedbackType),
      feedback: Joi.string().required(),
      state: Joi.string().valid(...CONSTANTS.feedbackState),
      last_updated: Joi.date(),
      createdAt: Joi.date(),
    });
  }

  static get relationMappings() {
    const Student = require('./student');
    const User = require('./user');

    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: Student,
        join: {
          from: 'feedbacks.studentId',
          to: 'students.id',
        },
      },
      user: {
          relation: Model.BelongsToOneRelation,
          modelClass: User,
          join: {
            from: 'feedbacks.userId',
            to: 'users.id',
          },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
