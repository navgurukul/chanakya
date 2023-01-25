const { string } = require('joi');
const Joi = require('joi');
const { Model } = require('./helpers');


module.exports = class StudentStage extends Model {
    static get tableName(){
        return 'students_stages'
    }
    static get joiSchema(){
        return Joi.object({
            id: Joi.number().integer().greater(0),
            student_id: Joi.number().integer().greater(0).required(),
            from_stage: Joi.string(),
            to_stage:string(),
            created_at:string()
        })
    }
    // $beforeInsert() {
    //     const now = new Date();
    //     this.created_at = now;
    // }
}