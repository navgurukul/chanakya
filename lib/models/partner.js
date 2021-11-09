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
      notes: Joi.string().allow(null),
      slug: Joi.string().required().allow(null),
      created_at: Joi.date(),
      referred_by: Joi.string().allow(null),
      email: Joi.string().email().allow(null),
      districts: Joi.array().items(Joi.string()).allow(null),
      state: Joi.string().allow(null),
      meraki_link: Joi.string().allow(null),
      web_link: Joi.string().allow(null),
    });
  }

  static get relationMappings() {
    const PartnerAssessment = require('./partnerAssessment');
    const Students = require('./student');
    return {
      assessments: {
        relation: Model.HasManyRelation,
        modelClass: PartnerAssessment,
        join: {
          from: 'partners.id',
          to: 'partner_assessments.partner_id',
        },
      },
      students: {
        relation: Model.HasManyRelation,
        modelClass: Students,
        join: {
          from: 'partners.id',
          to: 'students.partner_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
