const Joi = require('joi');
const { Model } = require('./helpers');

module.exports = class studentDocuments extends Model {
  static get tableName() {
    return 'student_documents';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      student_id: Joi.number().integer().greater(0).required(),
      Resume_link: Joi.string(),
      Id_proof_link: Joi.string(),
      signed_consent_link: Joi.string(),
      marksheet_link: Joi.string(),
    });
  }
};
