// const Schwifty = require('schwifty');
const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');

module.exports = class PartnerRelation extends Model {
  static get tableName() {
    return 'chanakya_partner_relationship';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      partner_id: Joi.number().integer(),
      partner_group_id: Joi.number().integer(),
    });
  }

  static get relationMappings() {
    
    return {
      // partner: {
      //   relation: Model.BelongsToOneRelation,
      //   modelClass: path.join(__dirname, 'partner'),
      //   join: {
      //     from: 'main.chanakya_partner_relationship.partner_id',
      //     to: 'main.partners.id',
      //   },
      // },
      // partner_group: {
      //   relation: Model.BelongsToOneRelation,
      //   modelClass: path.join(__dirname, 'partnerGroup'),
      //   join: {
      //     from: 'main.chanakya_partner_relationship.partner_group_id',
      //     to: 'main.chanakya_partner_group.id',
      //   },
      // },
      // students: {
      //   relation: Model.HasManyRelation,
      //   modelClass: path.join(__dirname, 'student'),
      //   join: {
      //     from: 'main.chanakya_partner_relationship.partner_id',
      //     to: 'main.students.partner_id',
      //   },
      // },
    };
  }
};
