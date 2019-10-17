
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class EnglishPassage extends Model {
  static get tableName() {
    return 'english_passages';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      passage: Joi.string().required(),
      createdAt: Joi.date(),
    });
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
