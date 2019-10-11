
const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');


module.exports = class QuestionBucketChoice extends Model {
  static get tableName() {
    return 'question_bucket_choices';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      bucketId: Joi.number().integer().greater(0).required(),
      questionIds: Joi.array().items(Joi.number().integer().greater(0)).required(),
      createdAt: Joi.date(),
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
          from: 'question_bucket_choices.bucketId',
          to: 'question_buckets.id',
        },
      },
      question: {
        relation: Model.BelongsToOneRelation,
        modelClass: Question,
        join: {
          from: 'question_bucket_choices.questionId',
          to: 'questions.id',
        },
      },
    };
  }

  $beforeInsert(ctx) {
    const now = new Date();
    this.createdAt = now;
  }
};
