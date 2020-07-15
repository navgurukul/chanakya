
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class QuestionOption extends Model {
  static get tableName() {
    return 'question_options';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      text: Joi.string().required(),
      question_id: Joi.number().integer().greater(0).required(),
      correct: Joi.boolean().required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const Question = require('./question');

    return {
      question: {
        relation: Model.BelongsToOneRelation,
        modelClass: Question,
        join: {
          from: 'question_options.question_id',
          to: 'questions.id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
