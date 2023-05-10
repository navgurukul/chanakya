const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers')


module.exports = class CurrentStage extends Model {
    static get tableName() {
        return 'student_stage_options';
    };
    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            current_stage: Joi.number().integer(),
            option_stage: Joi.number().integer()
        })
    }

    static get relationMappings() {
        // const NewStage = require('./new_student_stages')
        return {
            current_stages: {
                relation: Model.HasOneRelation,
                modelClass: path.join(__dirname, 'new_student_stages'),
                join: {
                    from: 'student_stage_options.current_stage',
                    to: 'new_student_stages.id',
                },
                
            },
            option_stages: {
                relation: Model.HasOneRelation,
                modelClass: path.join(__dirname, 'new_student_stages'),
                join: {
                    from: 'student_stage_options.option_stage',
                    to: 'new_student_stages.id',
                },
            
            },
        }
    }
}