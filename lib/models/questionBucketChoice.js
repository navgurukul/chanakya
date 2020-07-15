
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class QuestionBucketChoice extends Model {
  static get tableName() {
    return 'question_bucket_choices';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      bucket_id: Joi.number().integer().greater(0).required(),
      question_ids: Joi.array().items(Joi.number().integer().greater(0)).required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const Question = require('./question');
    const QuestionBucket = require('./questionBucket');

    return {
      bucket: {
        relation: Model.BelongsToOneRelation,
        modelClass: QuestionBucket,
        join: {
          from: 'question_bucket_choices.bucket_id',
          to: 'question_buckets.id',
        },
      },
      question: {
        relation: Model.BelongsToOneRelation,
        modelClass: Question,
        join: {
          from: 'question_bucket_choices.question_id',
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
