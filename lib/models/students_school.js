const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class StudentSchool extends Model {
  static get tableName() {
    return 'students_school';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      school_id: Joi.number().integer(),
      student_id: Joi.number().integer(),
    });
  }
};
