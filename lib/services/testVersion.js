'use strict';

const Schmervice = require('schmervice');
const _ = require("underscore");
const CONSTANTS = require('../constants');

module.exports = class TestVersioningService extends Schmervice.Service {

    async findById(id, txn=null) {
        const { TestVersion } = this.server.models();
        return await TestVersion.query(txn).throwIfNotFound().findById(id);
    }

    async findAll(txn) {
        const { TestVersion } = this.server.models();
        return await TestVersion.query(txn);
    }

    async findCurrent(txn) {
        const { TestVersion } = this.server.models();
        let version = await TestVersion.query().findOne({ current: true });
        return version;
    }

    async createAndMarkAsCurrent(version, txn=null) {
        const { TestVersion } = this.server.models();
        let oldVersion = await this.findCurrent();

        // create a new version with the flag of current
        version = _.extend(version, {current: true});
        let currentVersion = await TestVersion.query(txn).insertGraph(version);

        // disable the current flag on the older current version
        oldVersion.current = false;
        await TestVersion.query(txn).upsertGraph(oldVersion);

        return currentVersion;
    }

    async findAllQuestions(version) {
        const { Question } = this.server.models();

        let questions = await Question.query().whereIn('id', version.questionIds).eager('options');
        return questions;
    }

    async getReportForVersion(version) {
        const { QuestionAttempt } = this.server.models();

        let questions = await this.findAllQuestions(version);

        // group the ids on basis of mcq & integer type questions
        let mcqIds = [];
        let intIds = [];
        _.each(questions, (q) => {
            if (q.type == CONSTANTS.questions.types.mcq) {
                mcqIds.push(q.id);
            } else {
                intIds.push(q.id);
            }
        });

        // reports for mcq ids
        let mcqReport = await QuestionAttempt.knex()
                .select('questionId', 'selectedOptionId')
                .count('* as count')
                .from('question_attempts')
                .whereIn('questionId', mcqIds)
                .groupBy('selectedOptionId');
        mcqReport = _.groupBy(mcqReport, 'questionId');

        // reports for integer ids
        let intReport = await QuestionAttempt.knex()
                .select('questionId', 'textAnswer')
                .count('* as count')
                .from('question_attempts')
                .whereIn('questionId', intIds)
                .groupBy('textAnswer');
        intReport = _.groupBy(intReport, 'questionId');

        let allReports = _.extend(mcqReport, intReport);

        questions = _.map(questions, (q) => {
            q.report = _.object( _.map(allReports[q.id], (row) => {
                if (q.type == CONSTANTS.questions.types.mcq) {
                    return [row.selectedOptionId, row.count];
                } else {
                    return [row.textAnswer, row.count];
                }
            }) );
            return q;
        });

        return questions;

    }
};
