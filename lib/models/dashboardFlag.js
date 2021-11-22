const Joi = require("joi");
const _ = require("underscore");
const { Model } = require("./helpers");

module.exports = class DashboardFlag extends Model {
    
    static get tableName() {
        return "dashboard_flags";
    }

    static get joiSchema() {
        return Joi.object({
            id:Joi.number().integer().greater(0),
            
            // student id 
            student_id: Joi.number().integer(),
            // flag raised to indicate the issue
            flag: Joi.string()
        })
        
    }
    static get relationMappings() {
        const student = require('../models/student');
        return {
            student:{
                relation: Model.BelongsToOneRelation,
            modelClass: student,
            join: {
                from: "dashboard_flags.student_id",
                to: "student_id",
                },
            }
        }
    
    }
    $beforeInsert() {
        const now = new Date();
        this.created_at = now;
    }

}