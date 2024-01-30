const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers')


module.exports = class StudentTransitions extends Model {
    static get tableName() {
        return 'student_stage_transitions';
    };
    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            student_id: Joi.number().integer(),
            from_stage: Joi.number().integer(),
            to_stage: Joi.number().integer(),
            // created_at: Joi.date(),
            // transition_done_by: Joi.string()
        })
    }
    static get relationMappings() {
        return {
            student: {
                relation: Model.BelongsToOneRelation,
                modelClass: path.join(__dirname, 'student'),
                join: {
                    from: 'student_stage_transitions.student_id',
                    to: 'students.id',
                },
            }
        }
    }
}