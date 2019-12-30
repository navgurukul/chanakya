
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class Users extends Model {
  static get tableName() {
    return 'users';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      mobile: Joi.string().length(10),
      user_name: Joi.string(),
      mailId: Joi.string(),
      email: Joi.string(),
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
