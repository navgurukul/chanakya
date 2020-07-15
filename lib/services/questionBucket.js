
const Boom = require('boom');
const Schmervice = require('schmervice');
const _ = require('underscore');

module.exports = class QuestionBucketService extends Schmervice.Service {
  async findAll(txn) {
    const { QuestionBucket } = this.server.models();
    const questionBuckets = await QuestionBucket.query(txn);
    return questionBuckets;
  }

  async findById(id, txn) {
    const { QuestionBucket } = this.server.models();
    const questionBucket = await QuestionBucket.query(txn).throwIfNotFound().findById(id);
    return questionBucket;
  }

  async create(details, txn = null) {
    const { QuestionBucket } = this.server.models();
    const createQuestionBucket = await QuestionBucket.query(txn).insertGraph(details);
    return createQuestionBucket;
  }

  async findChoicesBybucket_id(bucket_id, txn = null) {
    const { QuestionBucketChoice, Question } = this.server.models();

    const choices = await QuestionBucketChoice.query(txn).where({ bucket_id });
    const promises = [];
    _.each(choices, (choice, i) => {
      const { question_ids } = choice;
      promises.push(Question.query(txn).whereIn('id', question_ids).then((questions) => {
        choices[i].questions = questions;
      }));
    });
    await Promise.all(promises);

    return choices;
  }

  async createChoice(bucket, question_ids, txn = null) {
    const { QuestionBucketChoice, Question } = this.server.models();

    // check if all the IDs in the `question_ids` are valid
    const questions = await Question.query(txn).whereIn('id', question_ids);
    if (questions.length !== question_ids.length) {
      throw Boom.badRequest('All the question_ids given are not valid.');
    }

    // check if the require num of question as per bucket & length of `question_ids` is equal
    if (questions.length !== bucket.num_questions) {
      throw Boom.badRequest('The number of questions in a bucket choice should be equal to what is specified in the bucket.');
    }

    // insert into DB
    const choice = await QuestionBucketChoice.query(txn).insertGraph({
      bucket_id: bucket.id,
      question_ids,
    });

    // return back the choice
    choice.questions = questions;
    return choice;
  }
};
