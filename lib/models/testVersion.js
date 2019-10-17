
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class TestVersion extends Model {
  static get tableName() {
    return 'test_versions';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string().required(),
      data: Joi.object({
        questionIds: Joi.array().items(Joi.number().integer().greater(0)).required(),
        buckets: Joi.array().items(Joi.object({
          bucketId: Joi.number().integer().greater(0).required(),
          choiceIds: Joi.array().items(Joi.number().integer().greater(0)).required(),
        })),
      }),
      current: Joi.boolean().required(),
      createdAt: Joi.date(),
    });
  }

  $beforeValidate(jsonSchema, json, opt) {
    console.log(this.createdAt, json, opt);
    return jsonSchema;
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
