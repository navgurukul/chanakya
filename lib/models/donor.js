// const Schwifty = require("schwifty");
const Joi = require("joi");
const { Model } = require("./helpers");
// const CONSTANTS = require("../constants");

module.exports = class Donor extends Model {
  static get tableName() {
    return "donor";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      donor: Joi.string(),
    });
  }    
};
