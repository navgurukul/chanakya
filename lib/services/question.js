const Schmervice = require('schmervice');

module.exports = class QuestionService extends Schmervice.Service {
  async findById(id, txn = null) {
    const { Question } = this.server.models();
    const question = await Question.query(txn).throwIfNotFound().findById(id).withGraphFetched('options');
    return question;
  }

  async create(question, txn = null) {
    const { Question } = this.server.models();
    const questionCreate = await Question.query(txn).insertGraph(question);
    return questionCreate;
  }

  async findAll(txn) {
    const { Question } = this.server.models();
    const question = await Question.query(txn).withGraphFetched('options');
    return question;
  }

  async update(question, txn = null) {
    const { Question, QuestionOption } = this.server.models();
    const options = question.options;
    delete question.options;
    const question_id=question.id;

    const questionUpdate = await Question.query(txn).upsertGraph(question);
    for (var option of options){
    const checkOption = await QuestionOption.query(txn).where('id',option.id);
    if(checkOption.length>0){

      const optionUpdate = await QuestionOption.query(txn).upsertGraph({...option,question_id});
    }else{
      const optionUpdate = await QuestionOption.query(txn).insert({...option,question_id});

    }
      
    }
    return questionUpdate
  }

  async delete(id, txn = null) {
    const { Question, QuestionOption } = this.server.models();
    await QuestionOption.query(txn).delete().where({ question_id: id });
    await Question.query(txn).delete().findById(id);
  }
};
