// const Schwifty = require("schwifty");
const Joi = require("joi");
const { Model } = require("./helpers");
// const CONSTANTS = require("../constants");

module.exports = class registrationFormData extends Model {
  static get tableName() {
    return "registration_form_data";
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      partner_id: Joi.number().integer().greater(0).required(),
      form_data: Joi.object(),
    });
  }
};
