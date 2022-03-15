// const Schwifty = require('schwifty');
const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers/index');
const CONSTANTS = require('../constants');

module.exports = class EnrolmentKey extends Model {
  static get tableName() {
    return 'enrolment_keys';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      key: Joi.string().length(6).required(),
      student_id: Joi.number().integer().greater(0).required(),
      start_time: Joi.date(),
      end_time: Joi.date(),
      total_marks: Joi.number().integer(),
      question_set_id: Joi.number().integer().greater(0),
      created_at: Joi.date(),
      // Record students type of test in enrolment_key table.
      type_of_test: Joi.string()
        .valid(...CONSTANTS.typeOfTest)
        .default('onlineTest'),
    });
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }

  static get relationMappings() {
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student'),
        join: {
          from: 'enrolment_keys.student_id',
          to: 'students.id',
        },
      },
      partner: {
        relation: Model.ManyToManyRelation,
        modelClass: path.join(__dirname, 'partner'),
        join: {
          from: 'enrolment_keys.student_id',
          through: {
            modelClass: path.join(__dirname, 'student'),
            from: 'students.id',
            to: 'students.partner_id',
          },
          to: 'partners.id',
        },
      },
      questionSet: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'questionSet'),
        join: {
          from: 'enrolment_keys.question_set_id',
          to: 'question_sets.id',
        },
      },
      transitions: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'studentTransitions'),
        join: {
          from: 'enrolment_keys.student_id',
          to: 'stage_transitions.student_id',
        },
      },
    };
  }

  static makeKey(length = 6) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let i = 0;
    for (i; i < length; i += 1) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  static async generateNewKey(student_id, question_set_id) {
    const key = this.makeKey();
    const dbKey = await this.query().findOne({ key });

    if (!dbKey) {
      const obj = {
        key,
        student_id,
      };
      if (question_set_id) {
        obj.question_set_id = question_set_id;
      }
      const insertKey = await this.query().insert(obj);
      return insertKey;
    }
    this.generateNewKey();
    return null;
  }
};
