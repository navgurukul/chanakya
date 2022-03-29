const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');

module.exports = class PartnerAssessment extends Model {
  static get tableName() {
    return 'partner_assessments';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string().required(),
      answer_key_url: Joi.string(),
      assessment_url: Joi.string(),
      question_set_id: Joi.number().integer().greater(0).required(),
      partner_id: Joi.number().integer().greater(0).required(),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'partner'),
        join: {
          from: 'partners.id',
          to: 'partner_assessments.partner_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
