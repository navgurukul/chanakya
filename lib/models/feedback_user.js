
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class Users extends Model {
  static get tableName() {
    return 'user';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      user_name: Joi.string().required(),
      email: Joi.string().required(),
      password: Joi.binary(),
      profilePic: Joi.string(),
      googleUserId: Joi.string(),
      createdAt: Joi.date(),
    });
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
