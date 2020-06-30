
const Joi = require('joi');
const Schmervice = require('schmervice');
const _ = require('underscore');
const Boom = require('boom');
const CONSTANTS = require('../constants');

const internals = {};
internals.topicItemAssessmentConfigSchema = Joi.object({
  topic: Joi.string().valid(...CONSTANTS.questions.topics).required(),
  difficulty: Joi.object({
    easy: Joi.number().integer().required(),
    medium: Joi.number().integer().required(),
    hard: Joi.number().integer().required(),
  }),
  sortedByDifficulty: Joi.boolean().required(),
});
internals.bucketItemAssessmentConfig = Joi.object({
  bucketName: Joi.string().required(),
});

internals.assessmentConfigSchema = Joi.array().items(
  internals.topicItemAssessmentConfigSchema,
  internals.bucketItemAssessmentConfig,
);


module.exports = class AssessmentService extends Schmervice.Service {
  async initialize() {
    this.questions = {};
    _.each(CONSTANTS.questions.topics, (topic) => {
      this.questions[topic] = { easy: [], medium: [], hard: [] };
    });

    // validate the assessment config
    Joi.attempt(CONSTANTS.questions.assessmentConfig, internals.assessmentConfigSchema);

    // TODO: check if the correct bucket names are used in the config

    // load the questions of the current version into the memory
    const { testVersioningService } = this.server.services();
    this.currentTestVersion = await testVersioningService.findCurrent();
    this.currentQuestions = await testVersioningService.getQuestions(this.currentTestVersion);
  }

  generateAssessmentQuestions() {
    const { assessmentConfig } = CONSTANTS.questions;

    const questionSet = [];
    _.each(assessmentConfig, (config) => {
      // one of the bucket choices need to be picked
      if (config.bucketName) {
        const bucket = _.where(this.currentQuestions.buckets, { name: config.bucketName })[0];
        const chosenChoiceIndex = _.random(0, bucket.choices.length - 1);
        const { questions } = bucket.choices[chosenChoiceIndex];
        questionSet.push(questions);
      } else if (config.topic) {
        // questions of the given topic of the particular difficulty level need to be picked
        let topicQuestions = [];
        _.each(config.difficulty, (nQuestions, level) => {
          const questions = _.sample(this.currentQuestions.withoutChoices[config.topic][level],
            nQuestions);
          topicQuestions.push(questions);
        });
        topicQuestions = _.flatten(topicQuestions);
        if (config.sortedByDifficulty) {
          topicQuestions = _.sortBy(topicQuestions, (q) => q.difficulty);
        } else {
          topicQuestions = _.shuffle(topicQuestions);
        }
        questionSet.push(topicQuestions);
      }
    });
    return _.flatten(questionSet);
  }

  async validateEnrolmentKey(Key, txn = null) {
    let key = Key;
    const { EnrolmentKey } = this.server.models();

    key = await EnrolmentKey.query(txn).where({ key }).eager('student');
    if (!key.length) {
      return false;
    }
    return key[0];
  }

  getEnrolmentKeyStatus(key) {
    /* Gives the status of the key. */
    /* The key can be in the following states: */
    /*
         * - testAnswered : The student has answered the test
         * - testStarted : The student has started the test but not answered it yet
         * - testTimeOverdue : #TODO: Will be implemented later
         * - testNotStarted : The student has not yet started answering the test
         */

    let status = 'testNotStarted';
    if (key.startTime && key.endTime) {
      status = 'testAnswered';
    } if (key.startTime && !key.endTime) {
      status = 'testStarted';
    }
    return status;
  }

  async createQuestionSetForPartner(txn) {
    console.log('Hello! I am creating a question set for a partner.');
    const { QuestionSet } = this.server.models();

    const questions = this.generateAssessmentQuestions();
    const questionSet = await QuestionSet.query(txn).insert({
      questionIds: _.map(questions, (question) => question.id),
      versionId: this.currentTestVersion.id,
    });

    return {
      questionSet,
      questions,
    };
  }

  async getQuestionsOfQuestionSet(questionSetId, txn = null) {
    const { Question, QuestionSet } = this.server.models();
    const questionSet = await QuestionSet.query(txn).findById(questionSetId);
    const { questionIds } = questionSet;
    let questions = await Question.query(txn).findByIds(questionSet.questionIds).eager('options');

    questions = _.map(questionIds, (id) => {
      // the re-ordering needs to be done as findByIds sorts them
      const question = _.where(questions, { id })[0];
      return question;
    });

    questionSet.questions = questions;
    return questionSet;
  }

  async getQuestionSetForEnrolmentKey(key, txn = null) {
    const { QuestionSet, EnrolmentKey } = this.server.models();

    let questions; let
      questionSet;
    // TODO: start time needs to be taken into consideration and amount of time left
    // for the student needs to be returned.
    if (key.questionSetId) { // the question set has already been created
      questionSet = await this.getQuestionsOfQuestionSet(key.questionSetId);
      questions = questionSet.questions;
    } else {
      // the question set needs to be created
      questions = this.generateAssessmentQuestions();
      questionSet = await QuestionSet.query(txn).insert({
        questionIds: _.map(questions, (question) => question.id),
        versionId: this.currentTestVersion.id,
      });

      // record the start time on the enrolment key object
      await EnrolmentKey.query(txn).patch({
        startTime: new Date(),
        questionSetId: questionSet.id,
      }).where({ id: key.id });
    }

    console.log(this.getAnswerObjectForAPI(questions));
    return questions;
  }

  getMarksForAttempt(attemptObj) {
    const { question } = attemptObj;
    let marks = 0;
    // let correctOption;
    const diffLevelStr = _.invert(CONSTANTS.questions.difficulty)[question.difficulty];
    if (question.type === CONSTANTS.questions.types.integer) {
      const [correctOption] = question.options;
      if (correctOption.text === attemptObj.textAnswer) {
        marks = CONSTANTS.questions.markingScheme[diffLevelStr];
      }
    } else {
      const [correctOption] = _.where(question.options, { correct: true });
      if (correctOption.id === attemptObj.selectedOptionId) {
        marks = CONSTANTS.questions.markingScheme[diffLevelStr];
      }
    }
    return marks;
  }

  getAnswerObjectForAPI(questions) {
    // helper function to help us test out the API
    const apiBody = _.object(_.map(questions, (question) => {
      const { id } = question;

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

      if (question.type === CONSTANTS.questions.types.integer) {
        return [id, correctOption.text];
      }
      return [id, correctOption];
    }));

    return JSON.stringify(apiBody, null, 2);
  }

  getAttempts(answers, key, questions) {
    let totalMarks = 0;

    const attempts = _.map(questions, (q) => {
      const attempt = {
        enrolmentKeyId: key.id,
        questionId: q.id,
        question: q,
      };
      if (q.type === CONSTANTS.questions.types.integer) {
        attempt.textAnswer = typeof answers[q.id] === 'string' ? answers[q.id].trim() : null;
      } else {
        attempt.selectedOptionId = answers[q.id] === null ? null : Number(answers[q.id]);
      }
      totalMarks += this.getMarksForAttempt(attempt);
      return _.omit(attempt, 'question');
    });

    return { attempts, totalMarks };
  }

  answersAddQuestionIds(answers, questions) {
    const newAnswers = {};
    const charOptions = ['a', 'b', 'c', 'd', 'e'];
    _.each(questions, (question, index) => {
      let answerValue;
      const studentAttempt = answers[index + 1];

      // return if the studentAttempt is a null
      if (studentAttempt === null) {
        newAnswers[question.id] = studentAttempt;
        return;
      }

      if (question.type === CONSTANTS.questions.types.mcq) {
        const oIndex = charOptions.indexOf(studentAttempt.toLowerCase());
        answerValue = question.options[oIndex].id;
      } else { // question is of integer type means a single answer
        answerValue = String(studentAttempt);
      }

      newAnswers[question.id] = answerValue;
    });

    return newAnswers;
  }

  async inFormTestResult(key, totalMarks) {
    const { EnrolmentKey } = this.server.models();
    const Key = key; const totalMark = totalMarks;
    const [studentDetail] = await EnrolmentKey.query().eager({
      student: {
        contacts: true,
      },
      questionSet: {
        testVersion: true,
      },
    }).where('studentId', Key.studentId);
    const testVersion = studentDetail.questionSet.testVersion.name;
    let stage;
    
    // Mark the student as pass / fail according to the gender specific cut off
    const studentGender = studentDetail.student.gender;
    const gender = _.invert(CONSTANTS.studentDetails.gender)[studentGender]
    const cutOff = CONSTANTS.testCutOff[gender];

    if (totalMark >= cutOff[testVersion]) {
      stage = 'pendingEnglishInterview';
    } else {
      stage = 'testFailed';
    }

    await this.patchStudentDetails(studentDetail, { stage }, gender);
  }

  async recordOfflineStudentAnswers(StudentDetails, Answers, questionSet, txn = null) {
    // taken out and deleted typeOfTest from studentDetails and instert into enrolment_keys table.
    let studentDetails = StudentDetails;
    let answers = Answers;
    const { studentService } = this.server.services();
    const { EnrolmentKey, QuestionAttempt } = this.server.models();

    studentDetails = studentService.swapEnumKeysWithValues(studentDetails);

    const student = await studentService.create('basicDetailsEntered', null, studentDetails);

    // create an enrolment key for the student (mark the question set)
    const key = await EnrolmentKey.generateNewKey(student.id, questionSet.id);
    answers = this.answersAddQuestionIds(answers, questionSet.questions);
    const { attempts, totalMarks } = this.getAttempts(answers, key, questionSet.questions);
    await QuestionAttempt.query(txn).insertGraph(attempts); // attempts

    // record the total marks on the enrolment key
    await EnrolmentKey.query(txn).patch({
      totalMarks,
      typeOfTest: 'offlineTest',
    }).where({ id: key.id });

    await this.inFormTestResult(key, totalMarks);
  }

  async recordStudentAnswers(key, answers, txn) {
    const { QuestionAttempt, EnrolmentKey } = this.server.models();

    // check if the question IDs in the answers object and the question IDs of the set match
    const questions = await this.getQuestionSetForEnrolmentKey(key);
    const answersQuestionIds = _.map(_.keys(answers), Number);
    const ansDiff = _.difference(answersQuestionIds, _.map(questions, (question) => question.id));
    if (ansDiff.length !== 0) {
      throw Boom.badRequest("All answers provided don't belong to the given question set.");
    }

    // create attempt objects to store in DB and calculate score
    const { attempts, totalMarks } = this.getAttempts(answers, key, questions);
    await QuestionAttempt.query(txn).insertGraph(attempts); // attempts

    // record the end time and total marks scored by the student
    await EnrolmentKey.query(txn).patch({
      endTime: new Date(),
      totalMarks,
    }).where({ id: key.id });

    await this.inFormTestResult(key, totalMarks);
  }

  async addOrUpdateWhatsappNumber(studentId, whatsappNum, txn = null) {
    // if the whatsapp number is given check if it exists in DB then mark
    // isWhatsapp as true otherwise create a new contact and mark isWhatsapp as true

    const { Contact } = this.server.models();
    const contacts = await Contact.query(txn).where({ mobile: whatsappNum, studentId });
    if (contacts.length === 0) {
      await Contact.query(txn).insert({
        mobile: whatsappNum,
        studentId,
        isWhatsapp: true,
        contact_type: "whatsapp"
      });
    } else {
      await Contact.query(txn).patch({
        isWhatsapp: true,
        contact_type: "whatsapp"
      }).where({ studentId, mobile: whatsappNum });
    }
  }

  async recordStageTranisiton(student, toStage, gender, txn = null) {
    const { StageTransition } = this.server.models();
    const { exotelService } = this.server.services();

    await StageTransition.query(txn).insert({
      studentId: student.id,
      fromStage: student.stage,
      toStage,
    });

    var templateStage = toStage;

    if (gender == "male") {
      templateStage = "closeBoysAdmission"
    }
    // send sms after recording the stage transitions
    if (exotelService.hasTemplateForStage(templateStage) === true) {
      if (!student.contacts) {
        await student.$relatedQuery('contacts');
      }
      const sendSMSPromises = [];
      _.each(student.contacts, (contact) => {
        const templateContext = {
          student,
          contact,
        };
        sendSMSPromises.push(exotelService.sendSMS(contact.mobile, templateStage, templateContext));
      });

      const SMSSend = await Promise.all(sendSMSPromises);
      return SMSSend;
    }

    return null;
  }

  async patchStudentDetails(key, Details = {}, gender, txn = null) {
    const details = Details;
    const { Student } = this.server.models();
    // update stage of student if specified
    if (details.stage) {
      await this.recordStageTranisiton(key.student, details.stage, gender, txn);
    }

    if (details.whatsapp) {
      const { whatsapp } = details;
      await this.addOrUpdateWhatsappNumber(key.studentId, whatsapp, txn);
      delete details.whatsapp;
    }

    if (!details.name) { // patch the other details on the student table
      const patchStudentDetail = await Student.query(txn).patch(details)
        .where({ id: key.student.id });
      return patchStudentDetail;
    }
    const patchStudentDetail = await Student.query(txn).patch(details).where({ id: key.studentId });
    return patchStudentDetail;
  }

  async patchStudentDetailsWithoutKeys(student, Details, txn = null) {
    const details = Details;
    // update stage of student if specified
    if (details.stage) {
      await this.recordStageTranisiton(student, details.stage, txn);
    }

    if (details.whatsapp) {
      const { whatsapp } = details;
      await this.addOrUpdateWhatsappNumber(student.id, whatsapp, txn);
      delete details.whatsapp;
    }
  }

  async ShowTestResult(Key, txn = null) {
    let key = Key;
    const { EnrolmentKey } = this.server.models();

    key = await EnrolmentKey.query(txn).where({ key }).eager({
      student: true,
      questionSet: {
        testVersion: true,
      },
    });
    const { student, questionSet } = key[0];
    if (key.length && questionSet) {
      const { testVersion } = questionSet;
      const TestVersion = testVersion.name;
      const studentGender = student.gender;
      const cutOff = CONSTANTS.testCutOff[_.invert(CONSTANTS.studentDetails.gender)[studentGender]];
      const Result = key[0].totalMarks >= cutOff[TestVersion] ? 'Passed' : 'Failed';
      return {
        Result,
        totalMarks: key[0].totalMarks,
      };
    }
    return null;
  }
};
