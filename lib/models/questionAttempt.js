const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers');

module.exports = class QuestionAttempt extends Model {
  static get tableName() {
    return 'question_attempts';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      enrolment_key_id: Joi.number().integer().greater(0).required(),
      question_id: Joi.number().integer().greater(0).required(),
      selected_option_id: Joi.number().integer().greater(0).allow(null),
      text_answer: Joi.string().allow(null),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      enrolmentKey: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'enrolmentKey'),
        join: {
          from: 'enrolment_keys.id',
          to: 'question_attempts.enrolment_key_id',
        },
      },
      question: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'question'),
        join: {
          from: 'questions.id',
          to: 'question_attempts.question_id',
        },
      },
      selectedOption: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'questionOption'),
        join: {
          from: 'question_options.id',
          to: 'question_attempts.selected_option_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
