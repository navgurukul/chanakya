
// const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require('underscore');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class Metrics extends Model {
  static get tableName() {
    return 'daily_metrics';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      gender: Joi.number().integer().valid(..._.values(CONSTANTS.studentDetails.gender))
        .allow(null),
      metric_name: Joi.string().required(),
      value: Joi.number().integer(),
      created_at: Joi.date(),
      date: Joi.date(),
    });
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
