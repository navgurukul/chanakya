// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
// const CONSTANTS = require('../constants');

module.exports = class StudentDonor extends Model {
  static get tableName() {
    return 'student_donor';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      donor_id: Joi.array(),
    });
  }
};
