
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');


module.exports = class Partner extends Model {
  static get tableName() {
    return 'partners';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string().required(),
      notes: Joi.string(),
      slug: Joi.string().required(),
      createdAt: Joi.date(),
    });
  }

  static get relationMappings() {
    const PartnerAssessment = require('./partnerAssessment');

    return {
      assessments: {
        relation: Model.HasManyRelation,
        modelClass: PartnerAssessment,
        join: {
          from: 'partners.id',
          to: 'partner_assessments.partnerId',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
