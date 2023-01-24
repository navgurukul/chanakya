const Joi = require('joi');
const { Model } = require('./helpers')


module.exports = class Stage extends Model {
    static get tableName() {
        return 'school_stage';
    }
    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            school_id: Joi.number().integer(),
            stageName: Joi.string(),
            stageType: Joi.string(),
        })
    }
}