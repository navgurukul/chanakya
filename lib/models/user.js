
const Schwifty = require('schwifty');
const _ = require('underscore');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class User extends Schwifty.Model {
  static get tableName() {
    return 'users';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string().required(),
      type: Joi.number().integer().valid(..._.values(CONSTANTS.userTypes)),
      email: Joi.string().email().required(),
      mobile: Joi.string().length(10).required(),
      password: Joi.binary().required(),
      partnerId: Joi.number().integer().greater(0),
    });
  }

  static get relationMappings() {
    const Partner = require('./partner');

    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Partner,
        join: {
          from: 'users.partnerId',
          to: 'partners.id',
        },
      },
    };
  }

  $beforeInsert(ctx) {
    const now = new Date();
    this.createdAt = now;
  }
};
