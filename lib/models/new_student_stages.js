const Joi = require('joi');
const { Model } = require('./helpers')


module.exports = class NewStages extends Model {
    static get tableName() {
        return 'new_student_stages';
    }
    static get joiSchema() {
        return Joi.object({
            id: Joi.number().integer().greater(0),
            stage: Joi.string()
        })
    }
}