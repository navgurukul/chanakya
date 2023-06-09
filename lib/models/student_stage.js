const { string } = require('joi');
const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers');


module.exports = class StudentStage extends Model {
    static get tableName() {
        return 'students_stages'
    }
    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            student_id: Joi.number().integer().greater(0).required(),
            from_stage: Joi.string().allow(null),
            to_stage: Joi.string(),
            created_at: Joi.string(),
            transition_done_by: Joi.string()
        })
    }

    static get relationMappings() {
        return {
            feedbacks_school: {
                relation: Model.BelongsToOneRelation,
                modelClass: path.join(__dirname, 'feedback'),
                join: {
                    from: ['students_stages.student_id', 'students_stages.to_stage'],
                    to: ['feedbacks.student_id', 'feedbacks.student_stage'],
                },
            },
        }
    }


    $beforeInsert() {
        const now = new Date();
        this.created_at = now;
    }
}