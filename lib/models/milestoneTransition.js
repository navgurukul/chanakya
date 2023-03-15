const Joi = require('joi');
const { Model } = require('./helpers/index');

module.exports = class MilestoneTransition extends Model {
    static get tableName() {
        return 'milestone_transition';
    }

    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            student_id: Joi.number().integer().greater(0).required(),
            from_stage: Joi.string(),
            to_stage: Joi.string(),
            created_at: Joi.date(),
            transition_done_by: Joi.string(),
            

        });
    }
};
