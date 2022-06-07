const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class studentJobDetails extends Model {
  static get tableName() {
    return 'student_job_details';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      job_designation: Joi.string(),
      job_location: Joi.string(),
      salary: Joi.string(),
      job_type: Joi.string(),
      employer: Joi.string(),
      resume: Joi.string(),
      offer_letter_date: Joi.date(),
    });
  }
};
