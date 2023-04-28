// const Schwifty = require('schwifty');
const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');

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
      state: Joi.string().allow(null, ''),
      meraki_link: Joi.string().allow(null, ''),
      web_link: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      logo: Joi.string().allow(null, ''),
      website_link: Joi.string().allow(null, ''),
      platform: Joi.string().allow(null, ''),
      point_of_contact_name: Joi.string().allow(null, ''),
      status: Joi.string().allow(null, ''),
      updatedAt: Joi.date()
    });
  }

  static get relationMappings() {
    return {
      assessments: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'partnerAssessment'),
        join: {
          from: 'partners.id',
          to: 'partner_assessments.partner_id',
        },
      },
      partnerUser: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'partnerUser'),
        join: {
          from: 'partners.id',
          to: 'partner_user.partner_id',
        },
      },
      students: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'student'),
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
  $beforeInsert() {
    const now = new Date();
    this.updatedAt = now;
  }
};
