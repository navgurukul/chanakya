const Joi = require('joi');
const { Model } = require('./helpers')
const path = require('path');
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
    static get relationMappings() {
        return{
            school_name: {
                relation: Model.HasOneRelation,
                modelClass: path.join(__dirname, 'school'),
                join: {
                from: 'school_stage.school_id',
                to: 'school.id',
                },
            },
            sub_stages: {
                relation: Model.HasManyRelation,
                modelClass: path.join(__dirname, 'subStage'),
                join: {
                  from: 'school_stage.id',
                  to: 'sub_stage.stage_id',
                },
              }           
        }
    }
}