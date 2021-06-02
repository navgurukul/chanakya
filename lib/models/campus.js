// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
// const CONSTANTS = require('../constants');

module.exports = class Campus extends Model {
  static get tableName() {
    return 'campus';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      campus: Joi.string(),
    });
  }
};
