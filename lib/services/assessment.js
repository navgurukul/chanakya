const Joi = require('joi');
const Schmervice = require('schmervice');
const _ = require('underscore');
const Boom = require('boom');
const CONSTANTS = require('../constants');
const { errorHandler } = require('../../errors/index');
const logger = require('../../server/logger');
// const sendEmail = require("../helpers/sendEmail");


const internals = {};
internals.topicItemAssessmentConfigSchema = Joi.object({
  topic: Joi.string()
    .valid(...CONSTANTS.questions.topics)
    .required(),
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
  internals.bucketItemAssessmentConfig
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
  async checkSchoolisValidORnot(school){
    const { School } = this.server.models();
    let schoolDetails = await School.query().findById(school);
    console.log(schoolDetails,'schoolDetails')
    if(schoolDetails){
      return true;
    }else{
      return false;
    }
  }
  
  //COPIED FROM DEV
  
  // async generateAssessmentQuestions(school_test) {
  //   const { assessmentConfig} = CONSTANTS.questions;
  //   const { Question } = this.server.models();
  //   const questionSet = [];

  //   // Custom function to get n random elements from an array
  //   function getRandom(arr, n) {
  //     var len = arr.length;
  //     if (n > len) n = len; // If n is greater than the number of elements, select all elements
  //     var result = new Array(n),
  //         taken = new Array(len);
  //     while (n--) {
  //         var x = Math.floor(Math.random() * len);
  //         result[n] = arr[x in taken ? taken[x] : x];
  //         taken[x] = --len in taken ? taken[len] : len;
  //     }
  //     return result;
  //   }
  //   if(school_test!=undefined){
  //     let schoolQuestions = await Question.query().where('schoolId',school_test).withGraphFetched('options');

  //     // Filter questions by type
  //     let type1Questions = schoolQuestions.filter(question => question.type === 1);
  //     let type2Questions = schoolQuestions.filter(question => question.type === 2);
  //     let type3Questions = schoolQuestions.filter(question => question.type === 3);

  //     // Select a random set of questions based on type
  //     type1Questions = getRandom(type1Questions, 12);
  //     type2Questions = getRandom(type2Questions, 6);
  //     type3Questions = getRandom(type3Questions, 2);

  //     // Concatenate the selected questions
  //     questionSet.push(...type1Questions, ...type2Questions, ...type3Questions);
  //   }else{
  //   _.each(assessmentConfig, (config) => {
  //     // one of the bucket choices need to be picked
  //     if (config.bucketName) {
  //       console.log("=====>>>", config.bucketName)
  //       const bucket = _.where(this.currentQuestions.buckets, {
  //         name: config.bucketName,
  //       })[0];
  //       console.log("=====>>>bucketbucket", bucket)
  //       const chosenChoiceIndex = _.random(0, bucket.choices.length - 1);
  //       const { questions } = bucket.choices[chosenChoiceIndex];
  //       console.log("=====>>>questionsquestions", questions)
  //       questionSet.push(questions);
  //     } else if (config.topic) {
  //       // questions of the given topic of the particular difficulty level need to be picked
  //       let topicQuestions = [];
  //       _.each(config.difficulty, (nQuestions, level) => {
  //         const questions = _.sample(
  //           this.currentQuestions.withoutChoices[config.topic][level],
  //           nQuestions
  //         );
  //         topicQuestions.push(questions);
  //       });
  //       topicQuestions = _.flatten(topicQuestions);
  //       if (config.sortedByDifficulty) {
  //         topicQuestions = _.sortBy(topicQuestions, (q) => q.difficulty);
  //       } else {
  //         topicQuestions = _.shuffle(topicQuestions);
  //       }
  //       questionSet.push(topicQuestions);
  //     }
  //   });
  // }
  //   return _.flatten(questionSet);
  // }

  async generateAssessmentQuestions(school_test) {
    const { assessmentConfig } = CONSTANTS.questions;
    const { Question } = this.server.models();
    const questionSet = [];
    // Custom function to get n random elements from an array
    function getRandom(arr, count) {
      return arr.sort(() => Math.random() - 0.5).slice(0, count);
    }

    // Fallback + randomized selection logic
    function getQuestionsWithFallback(questions, topic, requiredCounts) {
      const byDifficulty = {
        1: [],
        2: [],
        3: []
      };

      questions
        .filter(q => q.topic === topic)
        .forEach(q => {
          if (byDifficulty[q.difficulty]) {
            byDifficulty[q.difficulty].push(q);
          }
        });

      // Shuffle each difficulty bucket to make random selection more diverse
      Object.keys(byDifficulty).forEach(d => {
        byDifficulty[d] = _.shuffle(byDifficulty[d]);
      });

      // Randomized fallback selection
      function takeFrom(difficulty, count) {
        const taken = [];
        while (count > 0) {
          if (byDifficulty[difficulty]?.length > 0) {
            const pool = byDifficulty[difficulty];
            const idx = Math.floor(Math.random() * pool.length);
            taken.push(pool.splice(idx, 1)[0]);
            count--;
          } else if (difficulty > 1) {
            difficulty--;
          } else {
            break;
          }
        }
        return taken;
      }

      return [
        ...takeFrom(3, requiredCounts[3] || 0),
        ...takeFrom(2, requiredCounts[2] || 0),
        ...takeFrom(1, requiredCounts[1] || 0)
      ];
    }

    // If a specific school test is provided
    if (school_test !== undefined) {
      const schoolQuestions = await Question.query()
        .where('schoolId', school_test)
        .withGraphFetched('options');

      const type1Questions = getRandom(
        schoolQuestions.filter(q => q.difficulty === 1),
        12
      );
      const type2Questions = getRandom(
        schoolQuestions.filter(q => q.difficulty === 2),
        6
      );
      const type3Questions = getRandom(
        schoolQuestions.filter(q => q.difficulty === 3),
        2
      );

      questionSet.push(...type1Questions, ...type2Questions, ...type3Questions);

    } else {
      // Object for difficulty-level question count per topic (buckets)
      const numberObj = {
        'Percentage': { 1: 1, 2: 2, 3: 3 }, // 1, 2, 3  => easy, med, hard
        'Unitary Method': { 1: 0, 2: 2, 3: 0 }, //Only 2 Medium
        'Algebra': { 1: 2, 2: 2, 3: 2 } //2, 2, 2 => easy, med, hard
      };

      _.each(assessmentConfig, (config) => {
        if (config.bucketName) {
          const questionsOfParticularTopic = this.currentQuestions.questions.filter(
            q => q.topic == config.bucketName
          );
          console.log("questions=========>>>>questions",this.currentQuestions.questions)
          console.log("questionsOfParticularTopic=========>>>>questionsOfParticularTopic",questionsOfParticularTopic)

          const difficultyCounts = numberObj[config.bucketName] || {};
          const bucketQuestions = getQuestionsWithFallback(
            questionsOfParticularTopic,
            config.bucketName,
            difficultyCounts
          );

          questionSet.push(bucketQuestions);

        } else if (config.topic) {
          const topic = config.topic;
          const difficultyMap = { easy: 1, medium: 2, hard: 3 };
          const requiredCounts = {};

          _.each(config.difficulty, (count, level) => {
            const difficultyLevel = difficultyMap[level];
            requiredCounts[difficultyLevel] = count;
          });

          let topicQuestions = getQuestionsWithFallback(
            this.currentQuestions.questions,
            topic,
            requiredCounts
          );
          console.log("topicQuestions=========>>>>topicQuestions",topicQuestions)
          topicQuestions = config.sortedByDifficulty
            ? _.sortBy(topicQuestions, q => q.difficulty)
            : _.shuffle(topicQuestions);

          questionSet.push(topicQuestions);
        }
      });
    }
    console.log("questionSet=========>>>>questionSet",questionSet)
    return _.flatten(questionSet);
  }

  async validateEnrolmentKey(Key) {
    let key = Key;
    const { EnrolmentKey } = this.server.models();

    key = await EnrolmentKey.query().where({ key }).withGraphFetched('student');
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
    if (key.start_time && key.end_time) {
      status = 'testAnswered';
    }
    if (key.start_time && !key.end_time) {
      status = 'testStarted';
    }
    return status;
  }

  async createQuestionSetForPartner(txn) {
    try {
      const { QuestionSet } = this.server.models();

    const questions = await this.generateAssessmentQuestions();
    console.log("=========>>questions", questions)
    console.log("=========>>this.currentTestVersion.id", this.currentTestVersion.id)
    const questionSet = await QuestionSet.query(txn).insert({
      question_ids: _.map(questions, (question) => question.id),
      version_id: this.currentTestVersion.id,
    });
    console.log(questions[0], "questions...........166");
    console.log(questionSet[0], "questionSetquestionSet 167")

    return {
      questionSet,
      questions,
    };
      
    } catch (error) {
      console.log({error});
    }
    
  }

  async getQuestionsOfQuestionSet(question_set_id, txn = null) {
    const { Question, QuestionSet } = this.server.models();
    const questionSet = await QuestionSet.query(txn).findById(question_set_id);
    const { question_ids } = questionSet;
    let questions = await Question.query(txn)
      .findByIds(questionSet.question_ids)
      .withGraphFetched('options');

    questions = _.map(question_ids, (id) => {
      // the re-ordering needs to be done as findByIds sorts them
      const question = _.where(questions, { id })[0];
      return question;
    });

    questionSet.questions = questions;
    return questionSet;
  }

  async getQuestionSetForEnrolmentKey(key, school,txn = null) {
    const { QuestionSet, EnrolmentKey } = this.server.models();
    let questions;
    let questionSet;
    // TODO: start time needs to be taken into consideration and amount of time left
    // for the student needs to be returned.
    if (key.question_set_id) {
      // the question set has already been created
      questionSet = await this.getQuestionsOfQuestionSet(key.question_set_id);
      questions = questionSet.questions;
    } else {
      // the question set needs to be created
      questions = await this.generateAssessmentQuestions(school);
      questionSet = await QuestionSet.query(txn).insert({
        question_ids: _.map(questions, (question) => question.id),
        version_id: this.currentTestVersion.id,
      });
      console.log(questionSet,'177777777777')

      // record the start time on the enrolment key object
      await EnrolmentKey.query(txn)
        .patch({
          start_time: new Date(),
          question_set_id: questionSet.id,
        })
        .where({ id: key.id });
    }

    return questions;
  }

  getMarksForAttempt(attemptObj) {
    const { question } = attemptObj;
    let marks = 0;
    // let correctOption;
    const diffLevelStr = _.invert(CONSTANTS.questions.difficulty)[question.difficulty];
    if (question.type === CONSTANTS.questions.types.integer) {
      const [correctOption] = question.options;
      if (correctOption.text === attemptObj.text_answer) {
        marks = CONSTANTS.questions.markingScheme[diffLevelStr];
      }
    } else {
      const [correctOption] = _.where(question.options, { correct: true });
      if (correctOption.id === attemptObj.selected_option_id) {
        marks = CONSTANTS.questions.markingScheme[diffLevelStr];
      }
    }
    return marks;
  }

  getAnswerObjectForAPI(questions) {
    // helper function to help us test out the API
    const apiBody = _.object(
      _.map(questions, (question) => {
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
      })
    );

    return JSON.stringify(apiBody, null, 2);
  }

  getAttempts(answers, key, questions) {
    let total_marks = 0;

    const attempts = _.map(questions, (q) => {
      const attempt = {
        enrolment_key_id: key.id,
        question_id: q.id,
        question: q,
      };
      if (q.type === CONSTANTS.questions.types.integer) {
        attempt.text_answer = typeof answers[q.id] === 'string' ? answers[q.id].trim() : null;
      } else {
        attempt.selected_option_id = answers[q.id] === null ? null : Number(answers[q.id]);
      }
      total_marks += this.getMarksForAttempt(attempt);
      return _.omit(attempt, 'question');
    });

    return { attempts, total_marks };
  }

  answersAddquestion_ids(answers, questions) {
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
      } else {
        // question is of integer type means a single answer
        answerValue = String(studentAttempt);
      }

      newAnswers[question.id] = answerValue;
    });

    return newAnswers;
  }

  async inFormTestResult(key, total_marks) {
    const { EnrolmentKey } = this.server.models();
    const Key = key;
    const totalMark = total_marks;
    const [studentDetail] = await EnrolmentKey.query()
      .withGraphFetched({
        student: {
          contacts: true,
        },
        questionSet: {
          testVersion: true,
        },
      })
      .where('id', Key.id);
    const testVersion = studentDetail.questionSet.testVersion.name;
    let stage;

    // Mark the student as pass / fail according to the gender specific cut off
    const studentGender = studentDetail.student.gender;
    const gender = _.invert(CONSTANTS.studentDetails.gender)[studentGender];
    const cutOff = CONSTANTS.testCutOff[gender];
    let school;
    if (totalMark >= cutOff[testVersion]) {
      stage = 'pendingEnglishInterview';
      school = 'School Of Programming'
    } else {
      stage = 'testFailed';
      school = 'School Of Programming'
    }

    await this.patchStudentDetails(studentDetail, { stage,school }, gender);
    const { feedbackService, ownersService, studentService } = this.server.services();
    const patchedDetail = await studentService.findById(Key.student_id);
    if (patchedDetail && patchedDetail.stage === 'pendingEnglishInterview') {
      const assignWork = await ownersService.autoAssignFeat(
        {
          who_assign: '-*auto assign*-',
          student_stage: patchedDetail.stage,
          student_id: patchedDetail.id,
        },
        feedbackService,
        patchedDetail.stage,
        patchedDetail.id
      );
    }
  }

  async recordOfflineStudentAnswers(StudentDetails, Answers, questionSet, txn = null) {
    // taken out and deleted type_of_test from studentDetails and instert into enrolment_keys table.
    let studentDetails = StudentDetails;
    let answers = Answers;
    const { studentService } = this.server.services();
    const { EnrolmentKey, QuestionAttempt } = this.server.models();

    studentDetails = studentService.swapEnumKeysWithValues(studentDetails);

    const student = await studentService.create('basicDetailsEntered', null, studentDetails);

    // create an enrolment key for the student (mark the question set)
    const key = await EnrolmentKey.generateNewKey(student.id, questionSet.id);
    answers = this.answersAddquestion_ids(answers, questionSet.questions);
    const { attempts, total_marks } = this.getAttempts(answers, key, questionSet.questions);
    await QuestionAttempt.query(txn).insertGraph(attempts); // attempts

    // record the total marks on the enrolment key
    await EnrolmentKey.query(txn)
      .patch({
        total_marks,
        type_of_test: 'offlineTest',
      })
      .where({ id: key.id });

    await this.inFormTestResult(key, total_marks);
  }

  async recordStudentAnswers(key, answers, txn) {
    const { QuestionAttempt, EnrolmentKey } = this.server.models();

    // check if the question IDs in the answers object and the question IDs of the set match
    const questions = await this.getQuestionSetForEnrolmentKey(key);
    const answersquestion_ids = _.map(_.keys(answers), Number);
    const ansDiff = _.difference(
      answersquestion_ids,
      _.map(questions, (question) => question.id)
    );
    if (ansDiff.length !== 0) {
      logger.error(
        JSON.stringify({
          error: true,
          message: "All answers provided don't belong to the given question set.",
        })
      );
      throw Boom.badRequest("All answers provided don't belong to the given question set.");
    }

    // create attempt objects to store in DB and calculate score
    const { attempts, total_marks } = this.getAttempts(answers, key, questions);
    await QuestionAttempt.query(txn).insertGraph(attempts); // attempts

    // record the end time and total marks scored by the student
    await EnrolmentKey.query(txn)
      .patch({
        end_time: new Date(),
        total_marks,
      })
      .where({ id: key.id });

    await this.inFormTestResult(key, total_marks);
  }

  async addOrUpdateWhatsappNumber(student_id, whatsappNum, alt_mobile, txn = null) {
    // if the whatsapp number is given check if it exists in DB then mark
    // is_whatsapp as true otherwise create a new contact and mark is_whatsapp as true
    const { Contact } = this.server.models();
    const contacts = await Contact.query(txn).where({
      mobile: whatsappNum,
      student_id,
    });
    if (contacts.length === 0) {
      await Contact.query(txn).insert({
        mobile: whatsappNum,
        student_id,
        is_whatsapp: true,
        contact_type: 'whatsapp',
        alt_mobile,
      });
    } else {
      await Contact.query(txn)
        .patch({
          alt_mobile,
          is_whatsapp: true,
          contact_type: 'whatsapp',
        })
        .where({ student_id, mobile: whatsappNum });
    }
  }

  async recordStageTranisiton(student, to_stage, gender, transition_done_by, school, txn = null) {
    const { StageTransition } = this.server.models();
    const { exotelService } = this.server.services();

    const lastUpdated = await StageTransition.query(txn).insert({
      student_id: student.id,
      from_stage: student.stage,
      to_stage,
      transition_done_by,
      school
    });
    let templateStage = to_stage;

    if (gender === 'male') {
      templateStage = 'closeBoysAdmission';
    }
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

      await Promise.all(sendSMSPromises);
      // return SMSSend;
    }

    return lastUpdated.created_at;
  }

  async patchStudentDetails(enrolmentKey, details) {
    const newDetails = details;
    const { Student } = this.server.models();
    // update stage of student if specified
    if (newDetails.stage) {
      const lastUpdated = await this.recordStageTranisiton(
        enrolmentKey.student,
        details.stage,
        details.gender,
        details.transition_done_by,
        details.school
      );
      if (newDetails.transition_done_by) {
        delete newDetails.transition_done_by;
      }
      if (newDetails.school) {
        delete newDetails.school;
      }
      newDetails.last_updated = lastUpdated;
    }

    if (newDetails.whatsapp) {
      const { whatsapp, alt_mobile } = details;
      await this.addOrUpdateWhatsappNumber(enrolmentKey.student_id, whatsapp, alt_mobile);
      delete newDetails.whatsapp;
      delete newDetails.alt_mobile;
    }
    try {
      if (!newDetails.name) {
        await Student.query().patch(details).where({ id: enrolmentKey.student_id });

        //   let name = enrolmentKey.student.name;
        //   let email = enrolmentKey.student.email;
        //   let stage = details.stage;
        // if (stage === 'selectedAndJoiningAwaited' || stage === 'algebraInterviewFail' || stage === 'tuitionGroup' || stage === 'pendingCultureFitInterview' ) {
        //   let sendEmailToUser = await sendEmail.sendEmailToUsersForUpdateStage(name, email, stage)
        // }

        return enrolmentKey.student;
      }
      await Student.query().patch(details).where({ id: enrolmentKey.student.id });
    } catch (err) {
      logger.error(JSON.stringify(err));
      return [errorHandler(err), null];
    }
    return enrolmentKey.student;
  }

  async patchStudentDetailsWithoutKeys(student, Details, txn = null) {
    const details = Details;
    // update stage of student if specified
    if (details.stage) {
      await this.recordStageTranisiton(student, details.stage, null, null);
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

    key = await EnrolmentKey.query(txn)
      .where({ key })
      .withGraphFetched({
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
      const Result = key[0].total_marks >= (cutOff[TestVersion] || 21) ? 'Passed' : 'Failed';
      return {
        Result,
        total_marks: key[0].total_marks,
      };
    }
    return null;
  }
};
