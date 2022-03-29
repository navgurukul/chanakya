const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');

module.exports = class DashboardFlag extends Model {
  static get tableName() {
    return 'dashboard_flags';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),

      // student id
      student_id: Joi.number().integer().greater(0).required(),
      // flag raised to indicate the issue
      flag: Joi.string(),
    });
  }

  static get relationMappings() {
    return {
      Student: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student'),
        join: {
          from: 'dashboard_flags.student_id',
          to: 'students.id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }
};
