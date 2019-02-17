'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');
const { Model } = require('./helpers');

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
            totalMarks: Joi.number().integer().greater(0),
            createdAt: Joi.date()
        });
    }

    $beforeInsert(ctx) {
        const now = new Date();
        this.createdAt = now;
    }

    static get relationMappings() {
        const Student = require('./student');
        const QuestionSet = require("./questionSet");

        return {
            student: {
                relation: Model.BelongsToOneRelation,
                modelClass: Student,
                join: {
                    from: 'enrolment_keys.studentId',
                    to: 'students.id'
                }
            },
            questionSet: {
                relation: Model.HasManyRelation,
                modelClass: QuestionSet,
                join: {
                    from: 'enrolment_keys.id',
                    to: 'question_sets.enrolmentKeyId'
                }
            }
        }
    }

    static makeKey(length=6) {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        for (let i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    static async generateNewKey(studentId) {
        let key = this.makeKey();
        let dbKey = await this.query().findOne({key: key});

        if (!dbKey){
            return await this.query().insert({
                key: key,
                studentId: studentId
            });
        } else {
            this.generateNewKey();
        }
    }
};
