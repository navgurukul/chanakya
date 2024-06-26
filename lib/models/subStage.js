const Joi = require('joi');
const { Model } = require('./helpers');
const path = require('path');
module.exports = class SubStage extends Model {
  static get tableName() {
    return 'sub_stage';
  }
  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      school_id: Joi.number().integer(),
      stage_id: Joi.number().integer(),
      stage_name: Joi.string(),
      sub_stages: Joi.string(),
    });
  }
};
