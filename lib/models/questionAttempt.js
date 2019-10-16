
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');


module.exports = class QuestionAttempt extends Model {
  static get tableName() {
    return 'question_attempts';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      enrolmentKeyId: Joi.number().integer().greater(0).required(),
      questionId: Joi.number().integer().greater(0).required(),
      selectedOptionId: Joi.number().integer().greater(0).allow(null),
      textAnswer: Joi.string().allow(null),
      createdAt: Joi.date(),
    });
  }

  static get relationMappings() {
    const EnrolmentKey = require('./enrolmentKey');
    const Question = require('./question');
    const QuestionOption = require('./questionOption');

    return {
      enrolmentKey: {
        relation: Model.BelongsToOneRelation,
        modelClass: EnrolmentKey,
        join: {
          from: 'enrolment_keys.id',
          to: 'question_attempts.enrolmentKeyId',
        },
      },
      question: {
        relation: Model.BelongsToOneRelation,
        modelClass: Question,
        join: {
          from: 'questions.id',
          to: 'question_attempts.questionId',
        },
      },
      selectedOption: {
        relation: Model.BelongsToOneRelation,
        modelClass: QuestionOption,
        join: {
          from: 'question_options.id',
          to: 'question_attempts.selectedOptionId',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
