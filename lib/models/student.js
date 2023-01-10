const Joi = require('joi');
const _ = require('underscore');
const path = require('path');
const { Model } = require('./helpers/index');
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
      gender: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.studentDetails.gender)),
      dob: Joi.date().allow(null),
      email: Joi.string().email().allow(null),
      evaluation: Joi.string().allow(null),
      redflag: Joi.string().allow(null),
      image_url: Joi.string().allow(null),
      // geographic details
      state: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.states)),
      city: Joi.string().allow(null),
      district: Joi.string().allow(null),
      gps_lat: Joi.string().allow(null),
      gps_long: Joi.string().allow(null),
      pin_code: Joi.string().allow(null),

      // other details
      qualification: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.studentDetails.qualification))
        .allow(null),
      current_status: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.studentDetails.currentStatus))
        .allow(null),
      school_medium: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.studentDetails.school_medium))
        .allow(null),

      // Student academic detalis of 10th and 12th class
      percentage_in10th: Joi.string().allow(null, '').empty(['', null]),
      math_marks_in10th: Joi.number()
        .allow(null, '')
        .empty(['', null])
        .default(null),
      percentage_in12th: Joi.string().allow(null, '').empty(['', null]),
      math_marks_in12th: Joi.number()
        .allow(null, '')
        .empty(['', null])
        .default(null),

      // privilege related
      caste: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.studentDetails.caste))
        .allow(null),
      religon: Joi.number()
        .integer()
        .valid(..._.values(CONSTANTS.studentDetails.religon))
        .allow(null),

      // partner ID
      partner_id: Joi.number().integer().greater(0),
      stage: Joi.string()
        .valid(...CONSTANTS.studentStages)
        .allow(''),

      // tag for online classes
      tag: Joi.string().allow(null),

      created_at: Joi.date(),
      campus_status: Joi.string().allow(null),
      other_activities: Joi.string().allow(null),
      last_updated: Joi.date(),
      current_owner_id: Joi.number().integer().greater(0).allow(null),
      partner_refer: Joi.string().allow(null),
    });
  }

  static get relationMappings() {
    return {
      student_job_details: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'student_job_details'),
        join: {
          from: 'student_job_details.student_id',
          to: 'students.id',
        },
      },
      student_job_details_all: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'student_job_details'),
        join: {
          from: 'student_job_details.student_id',
          to: 'students.id',
        },
      },
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'partner'),
        join: {
          from: 'students.partner_id',
          to: 'partners.id',
        },
      },
      contacts: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'studentContact'),
        join: {
          from: 'students.id',
          to: 'contacts.student_id',
        },
      },
      transitions: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'studentTransitions'),
        join: {
          from: 'students.id',
          to: 'stage_transitions.student_id',
        },
      },
      enrolmentKey: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'enrolmentKey'),
        join: {
          from: 'students.id',
          to: 'enrolment_keys.student_id',
        },
      },
      partnerAssessment: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'partnerAssessment'),
        join: {
          from: 'students.partner_id',
          to: 'partner_assessments.partner_id',
        },
      },
      feedback: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'feedback'),
        join: {
          from: 'students.id',
          to: 'feedbacks.student_id',
        },
      },
      feedbacks: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'feedback'),
        join: {
          from: ['students.stage', 'students.id'],
          to: ['feedbacks.student_stage', 'feedbacks.student_id'],
        },
      },
      danglingtranstions: {
        relation: Model.HasManyRelation,
        modelClass: path.join(__dirname, 'studentTransitions'),
        join: {
          from: ['students.id', 'students.stage'],
          to: ['stage_transitions.student_id', 'stage_transitions.to_stage'],
        },
      },
      lastTransition: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'studentTransitions'),
        join: {
          from: ['students.id', 'students.stage'],
          to: ['stage_transitions.student_id', 'stage_transitions.to_stage'],
        },
      },
      campus: {
        relation: Model.ManyToManyRelation,
        modelClass: path.join(__dirname, 'campus'),
        join: {
          from: 'students.id',
          through: {
            from: 'student_campus.student_id',
            to: 'student_campus.campus_id',
          },
          to: 'campus.id',
        },
      },
      school: {
        relation: Model.ManyToManyRelation,
        modelClass: path.join(__dirname, 'school'),
        join: {
          from: 'students.id',
          through: {
            from: 'students_school.student_id',
            to: 'students_school.school_id',
          },
          to: 'school.id',
        },
      },

      studentCampus: {
        relation: Model.HasOneRelation,
        modelClass: path.join(__dirname, 'student_campus'),
        join: {
          from: 'students.id',
          to: 'student_campus.student_id',
        },
      },

      studentSchool: {
        relation: Model.HasOneRelation,
        modelClass: path.join(__dirname, 'students_school'),
        join: {
          from: 'students.id',
          to: 'students_school.student_id',
        },
      },
      studentDonor: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student_donor'),
        join: {
          from: 'students.id',
          to: 'student_donor.student_id',
        },
      },
      studentDocuments: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student_documents'),
        join: {
          from: 'students.id',
          to: 'student_documents.student_id',
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }

  static afterFind({ result }) {
    for (const i of result) {
      if (i.student_job_details) {
        if (i.student_job_details.length > 0) {
          i.student_job_details = i.student_job_details.slice(-1)[0];
        } else {
          i.student_job_details = {};
        }
      }
    }
    return result;
  }
};
