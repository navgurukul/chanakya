const Joi = require('joi');
const path = require('path');
const { Model } = require('./helpers');

module.exports = class SlotBooked extends Model {
  static get tableName() {
    return 'slot_booked';
  }

  static get joiSchema() {
    return Joi.object({
      id: Joi.number().integer().greater(0),
      interview_slot_id: Joi.number().integer(),
      student_id: Joi.number().integer().greater(0),
      created_at: Joi.date(),
    });
  }

  static get relationMappings() {
    return {
      interviewSlot: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'interviewSlot'),
        join: {
          from: 'slot_booked.interview_slot_id',
          to: 'interview_slot.id',
        },
      },
      students: {
        relation: Model.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'student'),
        join: {
          from: 'slot_booked.student_id',
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
