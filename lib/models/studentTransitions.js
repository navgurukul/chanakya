'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class StageTransition extends Model {

    static get tableName() {

        return 'stage_transitions';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            studentId: Joi.number().integer().greater(0).required(),
            fromStage: Joi.string().allow(CONSTANTS.studentStages),
            toStage: Joi.string().allow(CONSTANTS.studentStages).required(),
            createdAt: Joi.date(),
        });
    }

    static get relationMappings() {
        const Student = require('./student');

        return {
            student: {
                relation: Model.BelongsToOneRelation,
                modelClass: Student,
                join: {
                    from: 'stage_transitions.studentId',
                    to: 'students.id'
                }
            }
        }
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }

};
