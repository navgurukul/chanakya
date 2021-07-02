// const Schwifty = require("schwifty");
const Joi = require("joi");
const { Model } = require("./helpers");
// const CONSTANTS = require("../constants");

module.exports = class studentCampus extends Model {
  static get tableName() {
    return "student_campus";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      campus_id: Joi.number().integer().greater(0).required(),
    });
  }
};
