
const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require('underscore');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class Student extends Model {
  static get tableName() {
    return 'students';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),

      // student details
      name: Joi.string(),
      gender: Joi.number().integer().valid(..._.values(CONSTANTS.studentDetails.gender)),
      dob: Joi.date().allow(null),
      email: Joi.string().email().allow(null),

      // geographic details
      state: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.states)),
      city: Joi.string().allow(null),
      gpsLat: Joi.string().allow(null),
      gpsLong: Joi.string().allow(null),
      pinCode: Joi.string().allow(null),

      // other details
      qualification: Joi.number().integer().valid(..._.values(CONSTANTS.studentDetails.qualification)).allow(null),
      currentStatus: Joi.number().integer().valid(..._.values(CONSTANTS.studentDetails.currentStatus)).allow(null),
      schoolMedium: Joi.number().integer().valid(..._.values(CONSTANTS.studentDetails.schoolMedium)).allow(null),

      // Student academic detalis of 10th and 12th class
      percentageIn10th: Joi.string().allow(null, '').empty(['', null]),
      mathMarksIn10th: Joi.number().allow(null, '').empty(['', null]).default(null),
      percentageIn12th: Joi.string().allow(null, '').empty(['', null]),
      mathMarksIn12th: Joi.number().allow(null, '').empty(['', null]).default(null),

      // privilege related
      caste: Joi.number().integer().valid(..._.values(CONSTANTS.studentDetails.caste)).allow(null),
      religon: Joi.number().integer().valid(..._.values(CONSTANTS.studentDetails.religon)).allow(null),

      // partner ID
      partnerId: Joi.number().integer().greater(0),

      stage: Joi.string().valid(CONSTANTS.studentStages).required(),
      createdAt: Joi.date(),
    });
  }

  static get relationMappings() {
    const Contact = require('./studentContact');
    const Partner = require('./partner');
    const Transitions = require('./studentTransitions');
    const EnrolmentKey = require('./enrolmentKey');

    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Partner,
        join: {
          from: 'students.partnerId',
          to: 'partners.id',
        },
      },
      contacts: {
        relation: Model.HasManyRelation,
        modelClass: Contact,
        join: {
          from: 'students.id',
          to: 'contacts.studentId',
        },
      },
      transitions: {
        relation: Model.HasManyRelation,
        modelClass: Transitions,
        join: {
          from: 'students.id',
          to: 'stage_transitions.studentId',
        },
      },
      enrolmentKey: {
        relation: Model.HasManyRelation,
        modelClass: EnrolmentKey,
        join: {
          from: 'students.id',
          to: 'enrolment_keys.studentId',
        },
      },
    };
  }

  $beforeInsert(ctx) {
    const now = new Date();
    this.createdAt = now;
  }
};
