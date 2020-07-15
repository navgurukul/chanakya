
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');


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
    const Partner = require('./partner');

    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Partner,
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
