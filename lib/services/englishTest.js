
const Schmervice = require('schmervice');
const _ = require('underscore');

module.exports = class EnglishTestServices extends Schmervice.Service {
  async addQuestions(q, txn = null) {
    const { EnglishQuestion } = this.server.models();
    const data = await EnglishQuestion.query(txn).insert({
      question: q.question,
      passageId: q.passageId,
      type: q.type,
    });
    return data;
  }

  async addAllOptions(option, questionId, txn = null) {
    const { EnglishOption } = this.server.models();
    const questionOptions = option.options;
    _.each(questionOptions, async (o, index) => {
      questionOptions[index].questionId = questionId;
    });

    const data = await EnglishOption.query(txn).insertGraph(questionOptions);
    return data;
  }

  async addPassage(data, txn = null) {
    const { EnglishPassage } = this.server.models();
    const passage = await EnglishPassage.query(txn).insert({
      passage: data.passage,
    });
    return passage;
  }

  async updatePassages(data, passageId, txn = null) {
    const { EnglishPassage } = this.server.models();
    await EnglishPassage.query(txn).update({
      passage: data.passage,
    }).where('id', passageId);
  }

  async UpdateQuationById(q, id, txn = null) {
    const { EnglishQuestion } = this.server.models();
    const data = await EnglishQuestion.query(txn).update({
      question: q.question,
      passageId: q.passageId,
      type: q.type,
    }).where('id', id);
    return data;
  }

  async getQuestionSetForEnrolmentKey(key, txn = null) {
    const { EnglishEnrolmentKey } = this.server.models();
    let questions;
    // TODO: start time needs to be taken into consideration and amount of time left
    // for the student needs to be returned.
    if (key.passageId) { // the question set has already been created
      questions = await this.getQuestionsOfcreatedpassage(key.passageId);
    } else { // the question set needs to be created
      questions = await this.generateAssessmentQuestions();
      // record the start time on the enrolment key object
      await EnglishEnrolmentKey.query(txn).patch({
        startTime: new Date(),
        passageId: questions.passageId,
      }).where({ id: key.id });
      delete questions.passageId;
    }
    console.log(this.getAnswerObjectForAPI(questions.questions));
    return questions;
  }

  getAnswerObjectForAPI(questions) {
    // helper function to help us test out the API
    const apiBody = _.object(_.map(questions, (question) => {
      const id = question.id;
      let correctOption = {};
      _.each(question.options, (option, index) => {
        if (option.correct === true) {
          correctOption = {
            id: option.id,
            index: index + 1,
            text: option.text,
          };
        }
      });
      return [id, correctOption];
    }));
    return JSON.stringify(apiBody, null, 2);
  }

  async getQuestionsOfcreatedpassage(passageId, txn = null) {
    const { EnglishPassage, EnglishQuestion } = this.server.models();

    const passage = await EnglishPassage.query(txn).where('id', passageId);
    const questions = await EnglishQuestion.query(txn).where('passageId', passageId).eager('options');
    _.map(questions, (q) => { return q.id; }); // questionId
    return {
      passage,
      questions,
    };
  }

  async generateAssessmentQuestions(txn = null) {
    const { EnglishPassage, EnglishQuestion } = this.server.models();

    const getAllPassages = await EnglishPassage.query(txn);
    const getRandomPassageId = Math.floor((Math.random() * getAllPassages.length) + 1);
    const passage = await EnglishPassage.query(txn).where('id', getRandomPassageId);
    const questions = await EnglishQuestion.query(txn).where('passageId', getRandomPassageId).eager('options');

    _.map(questions, (q) => { return q.id; }); // QuestionId
    return {
      passage,
      questions,
      passageId: getRandomPassageId,
    };
  }

  async getEnrolmentKeyStatus(key, txn = null) {
    /* Gives the status of the key. */
    /* The key can be in the following states: */
    /*
    * - testAnswered : The student has answered the test
    * - testStarted : The student has started the test but not answered it yet
    * * - testTimeOverdue : #TODO: Will be implemented later
    * * - testNotStarted : The student has not yet started answering the test
    * */
    const { EnglishEnrolmentKey } = this.server.models();
    const testStatus = await EnglishEnrolmentKey.query(txn).where({ keyId: key.id });
    if (testStatus[0].startTime && testStatus[0].endTime) {
      return {
        keystatus: 'testAnswered',
        key: testStatus[0],
      };
    } else if (testStatus[0].startTime && !testStatus[0].endTime) {
      return {
        keystatus: 'testStarted',
        key: testStatus[0],
      };
    } else {
      return {
        keystatus: 'testNotStarted',
        key: testStatus[0],
      };
    }
  }

  async getAllAnsweredOptions(answers, answerId, txn = null) {
    const { EnglishOption } = this.server.models();

    const promises = [];
    _.each(answerId, async (id) => {
      promises.push(EnglishOption.query(txn).where({ id: answers[id] }));
    });

    return Promise.all(promises);
  }

  async recordStudentAnswers(key, answers, txn = null) {
    const { EnglishQuestionAttempt, EnglishEnrolmentKey, EnglishQuestion } = this.server.models();

    // get all questions related with passage for total attempt storing in DB.
    const questions = await EnglishQuestion.query(txn).where({ passageId: key.passageId });

    // check if the question IDs in the answers object and the question IDs of the set match
    const answersQuestionIds = _.map(_.keys(answers), Number);
    const allAnsweredOptions = await this.getAllAnsweredOptions(answers, answersQuestionIds);
    const QuestionAttempt = [];
    let totalMarks = 0;

    // Calculate total obtanied marks.
    _.each(answersQuestionIds, (id, index) => {
      if (allAnsweredOptions[index].length && allAnsweredOptions[index][0].correct) {
        totalMarks += 1;
      }
    });

    // Stored selected optionId into DB.
    _.each(questions, (questionId) => {
      if (answers[questionId.id]) {
        QuestionAttempt.push({
          enrolmentKeyId: key.id,
          questionId: questionId.id,
          selectedOptionId: Number(answers[questionId.id]),
        });
      } else {
        QuestionAttempt.push({
          enrolmentKeyId: key.id,
          questionId: questionId.id,
          selectedOptionId: null,
        });
      }
    });

    await EnglishQuestionAttempt.query(txn).insertGraph(QuestionAttempt);

    // Record students total marks and end time of test.
    await EnglishEnrolmentKey.query(txn).update({
      keyId: key.keyId,
      totalMarks,
      endTime: new Date(),
    }).where({ id: key.id });

    return true;
  }
};
