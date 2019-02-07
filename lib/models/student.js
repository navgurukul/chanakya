'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');
const CONSTANTS = require('../constants');

module.exports = class Student extends Model {

    static get tableName() {

        return 'students';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            name: Joi.string(),
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
