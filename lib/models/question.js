// const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require('underscore');
const path = require('path');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class Question extends Model {
  static get tableName() {
    return 'questions';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      common_text: Joi.string().allow(null),
      en_text: Joi.string().required().allow(null),
      hi_text: Joi.string().required(),
      ma_text: Joi.string().required(),
      difficulty: Joi.number()
        .valid(..._.values(CONSTANTS.questions.difficulty))
        .required(),
      topic: Joi.string()
        .valid(...CONSTANTS.questions.topics)
        .required(),
      type: Joi.number()
        .valid(..._.values(CONSTANTS.questions.types))
        .required(),
      // 1 - mcq, 2 - integer
      schoolId:Joi.number().integer().optional().allow(null),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      options: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'questionOption'),
        join: {
          from: 'questions.id',
          to: 'question_options.question_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
