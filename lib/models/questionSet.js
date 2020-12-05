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
      question_ids: Joi.array().items(Joi.number().integer().greater(0)),
      version_id: Joi.number().integer().greater(0),
      created_at: Joi.date(),
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
          to: 'question_sets.version_id',
        },
      },
      enrolmentKey: {
        relation: Model.BelongsToOneRelation,
        modelClass: EnrolmentKey,
        join: {
          from: 'enrolment_keys.question_set_id',
          to: 'question_sets.id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
