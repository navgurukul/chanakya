
const Schmervice = require('schmervice');

module.exports = class QuestionService extends Schmervice.Service {
  async findById(id, txn = null) {
    const { Question } = this.server.models();
    return await Question.query(txn).throwIfNotFound().findById(id).eager('options');
  }

  async create(question, txn = null) {
    const { Question } = this.server.models();
    return await Question.query(txn).insertGraph(question);
  }

  async findAll(txn) {
    const { Question } = this.server.models();
    return await Question.query(txn).eager('options');
  }

  async update(question, txn = null) {
    const { Question } = this.server.models();
    return await Question.query().upsertGraph(question);
  }

  async delete(id, txn = null) {
    const { Question, QuestionOption } = this.server.models();
    await QuestionOption.query(txn).delete().where({ questionId: id });
    await Question.query(txn).delete().findById(id);
  }
};
