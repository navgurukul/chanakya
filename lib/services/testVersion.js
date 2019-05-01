'use strict';

const Boom = require('boom');
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

    async createAndMarkAsCurrent(versionName, questionIds, buckets, txn=null) {
        const {
            Question,
            QuestionBucket,
            QuestionBucketChoice,
            TestVersion
        } = this.server.models();

        // check if the given question IDs exist
        let questions = await Question.query(txn).whereIn('id', questionIds);
        if (questions.length != questionIds.length) {
            throw Boom.badRequest("All the questionIds given are not valid.");
        }

        // check if the bucket IDs given as the keys of the bucket key exist
        let bucketIds = _.map(buckets, b => b.bucketId);
        let dbBuckets = await QuestionBucket.query(txn).whereIn('id', bucketIds).eager('choices');
        if (dbBuckets.length != bucketIds.length) {
            throw Boom.badRequest("All the IDs of the bucket in the bucket object are not valid.");
        }

        // check if the choice IDs are valid
        _.each(dbBuckets, (bucket) => {
            let choices = bucket.choices;
            let b = _.where(buckets, {id: bucket.id});
            console.log(b);
        });

        // construct the version json
        let versionObj = {
            questionIds: questionIds,
            buckets: buckets,
        }

        // find the current version
        let oldVersion = await this.findCurrent();

        // create a new version with the newly constructed version object
        let currentVerison = await TestVersion.query(txn).insertGraph({
            name: versionName,
            data: versionObj,
            current: true
        })

        // disable the current flag on the older current version
        oldVersion.current = false;
        // await TestVersion.query(txn).upsertGraph(oldVersion);

        return currentVerison;
    }

    async findAllQuestions(version) {
        const { Question } = this.server.models();

        let questions = await Question.query().whereIn('id', version.data).eager('options');
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
