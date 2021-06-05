/* eslint-disable camelcase */
const Boom = require('boom');
const Schmervice = require('schmervice');
const _ = require('underscore');
const CONSTANTS = require('../constants');

module.exports = class TestVersioningService extends Schmervice.Service {
  async findById(id, txn = null) {
    const { TestVersion } = this.server.models();
    const testVersion = await TestVersion.query(txn).throwIfNotFound().findById(id);
    return testVersion;
  }

  async findAll(txn) {
    const { TestVersion } = this.server.models();
    const testVersions = await TestVersion.query(txn);
    return testVersions;
  }

  async findCurrent(txn) {
    const { TestVersion } = this.server.models();
    const version = await TestVersion.query(txn).findOne({ current: true });
    return version;
  }

  async createAndMarkAsCurrent(versionName, questionIds, buckets, txn = null) {
    const {
      Question,
      QuestionBucket,
      TestVersion,
    } = this.server.models();

    // check if the given question IDs exist
    const questions = await Question.query(txn).whereIn('id', questionIds);
    if (questions.length !== questionIds.length) {
      throw Boom.badRequest('All the question_ids given are not valid.');
    }

    // check if the bucket IDs given as the keys of the bucket key exist
    const bucket_ids = _.map(buckets, (b) => b.bucketId);
    const dbBuckets = await QuestionBucket.query(txn).whereIn('id', bucket_ids).eager('choices');
    if (dbBuckets.length !== bucket_ids.length) {
      throw Boom.badRequest('All the IDs of the bucket in the bucket object are not valid.');
    }

    // check if the choice IDs are valid
    _.each(buckets, (b) => {
      const dbBucket = _.where(dbBuckets, { id: b.bucketId })[0];
      _.each(b.choiceIds, (cId) => {
        const dbChoice = _.where(dbBucket.choices, { id: cId });
        if (dbChoice.length <= 0) {
          throw Boom.badRequest('All the choice IDs are not valid.');
        }
      });
    });

    // construct the version json
    const versionObj = {
      questionIds,
      buckets,
    };

    // find the current version
    const oldVersion = await this.findCurrent();

    // create a new version with the newly constructed version object
    const currentVerison = await TestVersion.query(txn).insertGraph({
      name: versionName,
      data: versionObj,
      current: true,
    });

    // disable the current flag on the older current version
    oldVersion.current = false;
    await TestVersion.query(txn).upsertGraph(oldVersion);

    return currentVerison;
  }

  async getQuestions(version) {
    const { Question, QuestionBucket, QuestionBucketChoice } = this.server.models();

    const versionQuestions = {
      withoutChoices: [],
      buckets: [],
    };

    // load the questions which are not attached to any choice
    const questions = await Question.query().skipUndefined().whereIn('id', version.data.questionIds).eager('options');
    _.each(CONSTANTS.questions.topics, (topic) => {
      versionQuestions.withoutChoices[topic] = { easy: [], medium: [], hard: [] };
    });
    _.each(questions, (q) => {
      if (q.difficulty === CONSTANTS.questions.difficulty.easy) {
        versionQuestions.withoutChoices[q.topic].easy.push(q);
      } else if (q.difficulty === CONSTANTS.questions.difficulty.medium) {
        versionQuestions.withoutChoices[q.topic].medium.push(q);
      } else {
        versionQuestions.withoutChoices[q.topic].hard.push(q);
      }
    });

    // load the questions in different choices associated with a bucket
    const promises = [];
    _.each(version.data.buckets, (b) => {
      const promise = QuestionBucket.query().findById(b.bucketId)
        .then((bucket) => {
          versionQuestions.buckets.push({ name: bucket.name, id: bucket.id, choices: [] });
          return QuestionBucketChoice.query().whereIn('id', b.choiceIds).eager('bucket');
        })
        .then((choices) => {
          const newPromises = [];
          _.each(choices, (choice) => {
            const p = Question.query().whereIn('id', choice.question_ids).eager('options')
              .then((ques) => {
                const bucketIndex = _.findIndex(versionQuestions.buckets, (buck) => {
                  const bucket_id = buck;
                  if (bucket_id.id === choice.bucket.id) {
                    return true;
                  }
                  return false;
                });
                const allQuestions = _.map(choice.question_ids, (question_id) => {
                  const q = _.where(ques, { id: question_id })[0];
                  return q;
                });
                versionQuestions.buckets[bucketIndex].choices.push({
                  questions: allQuestions,
                  id: choice.id,
                });
              });
            newPromises.push(p);
          });
          return Promise.all(newPromises);
        });
      promises.push(promise);
    });

    await Promise.all(promises);

    return versionQuestions;
  }

  async getReportForVersion(version) {
    const { QuestionAttempt } = this.server.models();

    let questions = await this.findAllQuestions(version);

    // group the ids on basis of mcq & integer type questions
    const mcqIds = [];
    const intIds = [];
    _.each(questions, (q) => {
      if (q.type === CONSTANTS.questions.types.mcq) {
        mcqIds.push(q.id);
      } else {
        intIds.push(q.id);
      }
    });

    // reports for mcq ids
    let mcqReport = await QuestionAttempt.knex()
      .select('question_id', 'selected_option_id')
      .count('* as count')
      .from('question_attempts')
      .whereIn('question_id', mcqIds)
      .groupBy('selected_option_id');
    mcqReport = _.groupBy(mcqReport, 'question_id');

    // reports for integer ids
    let intReport = await QuestionAttempt.knex()
      .select('question_id', 'text_answer')
      .count('* as count')
      .from('question_attempts')
      .whereIn('question_id', intIds)
      .groupBy('text_answer');
    intReport = _.groupBy(intReport, 'question_id');

    const allReports = _.extend(mcqReport, intReport);

    questions = _.map(questions, (ques) => {
      const q = ques;
      q.report = _.object(_.map(allReports[q.id], (row) => {
        if (q.type === CONSTANTS.questions.types.mcq) {
          return [row.selected_option_id, row.count];
        }
        return [row.text_answer, row.count];
      }));
      return q;
    });

    return questions;
  }
};
