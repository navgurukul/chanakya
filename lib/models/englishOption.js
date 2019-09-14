'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const _ = require("underscore");
const { Model } = require('./helpers');

module.exports = class EnglishOption extends Model {

    static get tableName() {

        return 'english_options';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            text: Joi.string().required(),
            questionId: Joi.number().integer().greater(0).required(),
            correct: Joi.boolean().required(),
            createdAt: Joi.date()
        });
    }
    
    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }
}