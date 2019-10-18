
// const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class EnrolmentKey extends Model {
  static get tableName() {
    return 'enrolment_keys';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      key: Joi.string().length(6).required(),
      studentId: Joi.number().integer().greater(0).required(),
      startTime: Joi.date(),
      endTime: Joi.date(),
      totalMarks: Joi.number().integer(),
      questionSetId: Joi.number().integer().greater(0),
      createdAt: Joi.date(),
      // Record students type of test in enrolment_key table.
      typeOfTest: Joi.string().valid(CONSTANTS.typeOfTest).default('onlineTest'),
    });
  }

  $beforeInsert() {
    const now = new Date();
    this.createdAt = now;
  }

  static get relationMappings() {
    const Student = require('./student');
    const QuestionSet = require('./questionSet');
    return {
      student: {
        relation: Model.BelongsToOneRelation,
        modelClass: Student,
        join: {
          from: 'enrolment_keys.studentId',
          to: 'students.id',
        },
      },
      questionSet: {
        relation: Model.BelongsToOneRelation,
        modelClass: QuestionSet,
        join: {
          from: 'enrolment_keys.questionSetId',
          to: 'question_sets.id',
        },
      },
    };
  }

  static makeKey(length = 6) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const i = 0;
    for (i; i < length; i + 1) text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  static async generateNewKey(studentId, questionSetId) {
    const key = this.makeKey();
    const dbKey = await this.query().findOne({ key });

    if (!dbKey) {
      const obj = {
        key,
        studentId,
      };
      if (questionSetId) {
        obj.questionSetId = questionSetId;
      }
      const insertKey = await this.query().insert(obj);
      return insertKey;
    }
    this.generateNewKey();
    return null;
  }
};
