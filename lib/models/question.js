
// const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require('underscore');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');


module.exports = class Question extends Model {
  static get tableName() {
    return 'questions';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      commonText: Joi.string().allow(null),
      enText: Joi.string().required().allow(null),
      hiText: Joi.string().required(),
      difficulty: Joi.number().valid(..._.values(CONSTANTS.questions.difficulty)).required(),
      topic: Joi.string().valid(...CONSTANTS.questions.topics).required(),
      type: Joi.number().valid(..._.values(CONSTANTS.questions.types)).required(),
      // 1 - mcq, 2 - integer
      createdAt: Joi.date(),
    });
  }

  static get relationMappings() {
    const QuestionOption = require('./questionOption');

    return {
      options: {
        relation: Model.HasManyRelation,
        modelClass: QuestionOption,
        join: {
          from: 'questions.id',
          to: 'question_options.questionId',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
