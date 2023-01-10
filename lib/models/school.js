const Joi = require('joi');
const { Model } = require('./helpers');
const path = require('path');

module.exports = class School extends Model {
  static get tableName() {
    return 'school';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      name: Joi.string(),
    });
  }
  
  static get relationMappings() {
    console.log(path.join(__dirname, 'students_school.js'))
    return {
      students: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'students_school.js'),
        join: {
          from: 'school.id',
          to: 'students_school.school_id',
        },
      },
    }
  }
};
