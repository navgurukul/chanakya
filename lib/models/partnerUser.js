const Joi = require('joi');
const path = require('path');
const { Model } = require('objection');

module.exports = class PartnerUser extends Model {
  static get tableName() {
    return 'partner_user';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      partner_id: Joi.number(),
      email: Joi.string().email().required(),
    });
  }

  static get relationMappings() {
    /* eslint-disable global-require */
    const Partner = require('./partner');
    /* eslint-enable global-require */

    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'partner'),
        join: {
          from: 'partner_user.partner_id',
          to: 'partners.id',
        },
      },
    };
  }

  async $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
