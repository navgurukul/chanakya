
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');


module.exports = class QuestionBucket extends Model {
  static get tableName() {
    return 'question_buckets';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string().max(100).required(),
      num_questions: Joi.number().integer(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const QuestionBucketChoice = require('./questionBucketChoice');

    return {
      choices: {
        relation: Model.HasManyRelation,
        modelClass: QuestionBucketChoice,
        join: {
          from: 'question_buckets.id',
          to: 'question_bucket_choices.bucket_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
