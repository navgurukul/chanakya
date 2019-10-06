
const Boom = require('boom');
const Schmervice = require('schmervice');
const _ = require('underscore');

module.exports = class QuestionBucketService extends Schmervice.Service {
  async findAll(txn) {
    const { QuestionBucket } = this.server.models();
    return await QuestionBucket.query(txn);
  }

  async findById(id, txn) {
    const { QuestionBucket } = this.server.models();
    return await QuestionBucket.query(txn).throwIfNotFound().findById(id);
  }

  async create(details, txn = null) {
    const { QuestionBucket } = this.server.models();
    return await QuestionBucket.query(txn).insertGraph(details);
  }

  async findChoicesByBucketId(bucketId, txn = null) {
    const { QuestionBucketChoice, Question } = this.server.models();

    const choices = await QuestionBucketChoice.query(txn).where({ bucketId });
    const promises = [];
    _.each(choices, (choice, i) => {
      const { questionIds } = choice;
      promises.push(Question.query(txn).whereIn('id', questionIds).then((questions) => {
        choices[i].questions = questions;
      }));
    });
    await Promise.all(promises);

    return choices;
  }

  async createChoice(bucket, questionIds, txn = null) {
    const { QuestionBucketChoice, Question } = this.server.models();

    // check if all the IDs in the `questionIds` are valid
    const questions = await Question.query(txn).whereIn('id', questionIds);
    if (questions.length != questionIds.length) {
      throw Boom.badRequest('All the questionIds given are not valid.');
    }

    // check if the require num of question as per bucket & length of `questionIds` is equal
    if (questions.length != bucket.numQuestions) {
      throw Boom.badRequest('The number of questions in a bucket choice should be equal to what is specified in the bucket.');
    }

    // insert into DB
    const choice = await QuestionBucketChoice.query(txn).insertGraph({
      bucketId: bucket.id,
      questionIds,
    });

    // return back the choice
    choice.questions = questions;
    return choice;
  }
};
