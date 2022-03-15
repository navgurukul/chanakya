const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers');

module.exports = class OwnerSchedule extends Model {
  static getTableName() {
    return 'owner_schedule';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      owner_id: Joi.number().integer(),
      from: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
      to: Joi.string().regex(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'owners'),
        join: {
          from: 'owner_schedule.owner_id',
          to: 'interview_owners.id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
