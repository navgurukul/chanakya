const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class CampusSchool extends Model {
  static get tableName() {
    return 'main.campus_school';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      campus_id: Joi.number().integer(),
      school_id: Joi.number().integer(),
      capacityofschool: Joi.number().integer(),
    });
  }
};
