// const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require('underscore');
const path = require('path');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class Owners extends Model {
  static get tableName() {
    return 'interview_owners';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      user_id: Joi.number().integer().greater(0),
      gender: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.ownerDetails.gender)),
      available: Joi.boolean(),
      max_limit: Joi.number().integer().greater(0),
      type: Joi.string(),
      pending_interview_count: Joi.number().integer(),
    });
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.HasOneRelation,
        modelClass: path.join(__dirname, 'user'),
        join: {
          from: 'interview_owners.user_id',
          to: 'c_users.id',
        },
      },
    };
  }

  // TODO: addthe created at updated column
  $beforeInsert() {
    const now = new Date();
    this.pending_interview_count = 0;
  }

  $beforeUpdate() {
    const now = new Date();
  }
};
