'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require("underscore");
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
            gender: Joi.number().integer().valid( ..._.values(CONSTANTS.studentDetails.gender) ),
            dob: Joi.date(),
            whatsapp: Joi.string().length(10),
            email: Joi.string().email(),

            // geographic details
            state: Joi.string().valid( ..._.keys(CONSTANTS.studentDetails.states) ),
            city: Joi.string(),
            gps: Joi.object({
                lat: Joi.string(),
                long: Joi.string()
            }),

            // other details
            qualification: Joi.number().integer().valid( ..._.values(CONSTANTS.studentDetails.qualification) ),
            currentStatus: Joi.number().integer().valid( ..._.values(CONSTANTS.studentDetails.currentStatus) ),

            // privilege related
            caste: Joi.number().integer().valid( ..._.values(CONSTANTS.studentDetails.caste) ),
            religon: Joi.number().integer().valid( ..._.values(CONSTANTS.studentDetails.religon) ),

            stage: Joi.string().allow(CONSTANTS.studentStages).required(),
            createdAt: Joi.date(),
        });

    }

    static get relationMappings() {
        const Contact = require('./studentContact');

        return {
            contacts: {
                relation: Model.HasManyRelation,
                modelClass: Contact,
                join: {
                    from: 'students.id',
                    to: 'contacts.studentId'
                }
            }
        }
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }

};
