const Schmervice = require('schmervice');

module.exports = class QuestionAttemptService extends Schmervice.Service {
  async findByEnrolmentKey(enrolment_keys) {
    const { EnrolmentKey } = this.server.models();
    const enrolmentKey = await EnrolmentKey.query().select('id').where('key', enrolment_keys);
    let keyId;
    for (let i of enrolmentKey) {
      keyId = i.id;
    }
    return keyId;
  }

  async findQuestionIdByEnrolmentKeyId(enrolment_keys, txn = null) {
    const { QuestionAttempt, Question} = this.server.models();
    const id = await this.findByEnrolmentKey(enrolment_keys);
    const questions = await QuestionAttempt.query(txn)
      .throwIfNotFound()
      .where('enrolment_key_id', id);
    let questionsNumList = [];
    for (const id of questions) {
      questionsNumList.push(id.question_id);
    }

    let Quetions = {};
    let count = 1;
    for (const idOfQue of questionsNumList) {
      const questions = await Question.query(txn)
        .throwIfNotFound()
        .where('id', idOfQue)
        .withGraphFetched('options');
      Quetions[count] = questions;
      count++;
    }
    return Quetions;
  }
};
