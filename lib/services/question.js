
const Schmervice = require('schmervice');

module.exports = class QuestionService extends Schmervice.Service {
  async findById(id, txn = null) {
    const { Question } = this.server.models();
    const question = await Question.query(txn).throwIfNotFound().findById(id).eager('options');
    return question;
  }

  async create(question, txn = null) {
    const { Question } = this.server.models();
    const questionCreate = await Question.query(txn).insertGraph(question);
    return questionCreate;
  }

  async findAll(txn) {
    const { Question } = this.server.models();
    const question = await Question.query(txn).eager('options');
    return question;
  }

  async update(question, txn = null) {
    const { Question } = this.server.models();
    const questionUpdate = await Question.query(txn).upsertGraph(question);
    return questionUpdate;
  }

  async delete(id, txn = null) {
    const { Question, QuestionOption } = this.server.models();
    await QuestionOption.query(txn).delete().where({ questionId: id });
    await Question.query(txn).delete().findById(id);
  }
};
