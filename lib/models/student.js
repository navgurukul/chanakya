// const Schwifty = require('schwifty');
const Joi = require("joi");
const _ = require("underscore");
const { Model } = require("./helpers");
const CONSTANTS = require("../constants");

module.exports = class Student extends Model {
  static get tableName() {
    return "students";
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

      // geographic details
      state: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.states)),
      city: Joi.string().allow(null),
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
      percentage_in10th: Joi.string().allow(null, "").empty(["", null]),
      math_marks_in10th: Joi.number()
        .allow(null, "")
        .empty(["", null])
        .default(null),
      percentage_in12th: Joi.string().allow(null, "").empty(["", null]),
      math_marks_in12th: Joi.number()
        .allow(null, "")
        .empty(["", null])
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

      stage: Joi.string().valid(CONSTANTS.studentStages).required(),

      // tag for online classes
      tag: Joi.string().allow(null),

      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    const Contact = require("./studentContact");
    const Partner = require("./partner");
    const Transitions = require("./studentTransitions");
    const EnrolmentKey = require("./enrolmentKey");
    const PartnerAssessment = require("./partnerAssessment");
    const Feedback = require("./feedback");
    const Campus = require("./campus");
    const Donor = require("./donor");
    return {
      partner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Partner,
        join: {
          from: "students.partner_id",
          to: "partners.id",
        },
      },
      contacts: {
        relation: Model.HasManyRelation,
        modelClass: Contact,
        join: {
          from: "students.id",
          to: "contacts.student_id",
        },
      },
      transitions: {
        relation: Model.HasManyRelation,
        modelClass: Transitions,
        join: {
          from: "students.id",
          to: "stage_transitions.student_id",
        },
      },
      enrolmentKey: {
        relation: Model.HasManyRelation,
        modelClass: EnrolmentKey,
        join: {
          from: "students.id",
          to: "enrolment_keys.student_id",
        },
      },
      partnerAssessment: {
        relation: Model.BelongsToOneRelation,
        modelClass: PartnerAssessment,
        join: {
          from: "students.partner_id",
          to: "partner_assessments.partner_id",
        },
      },
      feedback: {
        relation: Model.HasManyRelation,
        modelClass: Feedback,
        join: {
          from: "students.id",
          to: "feedbacks.student_id",
        },
      },
      feedbacks: {
        relation: Model.BelongsToOneRelation,
        modelClass: Feedback,
        join: {
          from: ["students.stage", "students.id"],
          to: ["feedbacks.student_stage", "feedbacks.student_id"],
        },
      },
      danglingtranstions: {
        relation: Model.HasManyRelation,
        modelClass: Transitions,
        join: {
          from: ["students.id", "students.stage"],
          to: ["stage_transitions.student_id", "stage_transitions.to_stage"],
        },
      },
      lastTransition: {
        relation: Model.BelongsToOneRelation,
        modelClass: Transitions,
        join: {
          from: ["students.id", "students.stage"],
          to: ["stage_transitions.student_id", "stage_transitions.to_stage"],
        },
      },
      campus:{
        relation: Model.BelongsToOneRelation,
        modelClass: Campus,
        join: {
          from: "students.id",
          to: "campus.student_id",
        },
      },
      
      donor:{
        relation: Model.BelongsToOneRelation,
        modelClass: Donor,
        join: {
          from: "students.id",
          to: "donor.student_id",
        },
      },
    };
  }

  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
  }
};
