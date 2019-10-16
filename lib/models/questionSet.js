
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');


module.exports = class QuestionSet extends Model {
  static get tableName() {
    return 'question_sets';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      questionIds: Joi.array().items(Joi.number().integer().greater(0)),
      versionId: Joi.number().integer().greater(0),
      createdAt: Joi.date(),
    });
  }

  static get relationMappings() {
    const EnrolmentKey = require('./enrolmentKey');
    const TestVersion = require('./testVersion');

    return {
      testVersion: {
        relation: Model.BelongsToOneRelation,
        modelClass: TestVersion,
        join: {
          from: 'test_versions.id',
          to: 'question_sets.versionId',
        },
      },
      enrolmentKey: {
        relation: Model.BelongsToOneRelation,
        modelClass: EnrolmentKey,
        join: {
          from: 'enrolment_keys.questionSetId',
          to: 'question_sets.id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
