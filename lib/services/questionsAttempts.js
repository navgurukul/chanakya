const Schmervice = require('schmervice');

module.exports = class QuestionAttemptService extends Schmervice.Service {

  async findQuestionIdByEnrolmentKeyId(id, txn = null) {
    const { QuestionAttempt, Question } = this.server.models();
    const questions = await QuestionAttempt.query(txn)
      .throwIfNotFound()
      .where('enrolment_key_id', id);

    let Questions = [];
    for (const idOfQue of questions) {
      let data = [];
      if (idOfQue.selected_option_id !== null) {
        data.push({ selected_option_id: idOfQue.selected_option_id });
      } else {
        data.push({ text_answer: idOfQue.text_answer });
      }
      const questions = await Question.query(txn)
        .throwIfNotFound()
        .where('id', idOfQue.question_id)
        .withGraphFetched('options');
      data.push(questions);
      Questions.push(data);
    }
    return Questions;
  }
};
