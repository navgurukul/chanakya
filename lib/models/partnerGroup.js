// const Schwifty = require('schwifty');
const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');

module.exports = class PartnerGroup extends Model {
  static get tableName() {
    return 'chanakya_partner_group';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string().required(),
    });
  }

  static get relationMappings() {
    
    return {
    //   partner: {
    //     relation: Model.HasOneThroughRelation,
    //     modelClass: path.join(__dirname, 'partner'),
    //     join: {
    //       from: 'main.chanakya_partner_group.id',
    //       through:{
    //         from: 'main.chanakya_partner_group.id',
    //         to:'main.chanakya_partner_relationship.partner_id'
    //       },
    //       to: 'main.partners.id',
    //     },
    //   },
    //   partner_relationship: {
    //     relation: Model.BelongsToOneRelation,
    //     modelClass: path.join(__dirname, 'partnerGroup'),
    //     join: {
    //       from:'main.chanakya_partner_group.id',
    //       to: 'main.chanakya_partner_relationship.partner_group_id',

    //     },
    //   },
    //   students: {
    //     relation: Model.HasOneThroughRelation,
    //     modelClass: path.join(__dirname, 'student'),
    //     join: {
    //       from: 'main.chanakya_partner_group.id',
    //       through:{
    //         from: 'main.chanakya_partner_group.id',
    //         to:'main.chanakya_partner_relationship.partner_id'
    //       },
    //       to: 'main.students.partner_id',
    //     },
    //   },
    };
  }
};
