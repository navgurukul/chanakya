const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');
const CONSTANT = require("../constants");


module.exports = class Milestone extends Model {
    static get tableName() {
      return 'main.milestone_transition';
    }
  
    static get joiSchema() {
      return Joi.object({
        id: Joi.number().integer().greater(0),
        student_id: Joi.number().integer().greater(0),
        from_milestone: Joi.string()
        .valid(...CONSTANT.studentStages)
        .allow(''),
        to_milestone:  Joi.string()
        .valid(...CONSTANT.studentStages)
        .required(),
        mentors_feedback: Joi.string().allow(''),
        transition_done_by:Joi.string(),
        created_at: Joi.date(),
      });
    }
    static get relationMappings() {
      return {
        student: {
          relation: Model.BelongsToOneRelation,
          modelClass: path.join(__dirname, 'student'),
          join: {
            from: 'milestone_transition.student_id',
            to: 'students.id',
          },
        },
      };
    }
  
    $beforeInsert() {
      const now = new Date();
      this.created_at = now;
    }
  };
  