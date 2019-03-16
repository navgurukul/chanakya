'use strict';

const Schmervice = require('schmervice');
const CONSTANTS = require('../constants');
const _ = require("underscore");
const Boom = require('boom');

module.exports = class AssessmentService extends Schmervice.Service {

    async initialize() {
        this.questions = {};
        _.each(CONSTANTS.questions.topics, (topic) => {
            this.questions[topic] = { easy: [], medium: [], hard: [] }
        });

        // load all the questions in the DB into the memory
        // will be easy to serve question sets like this.
        const { Question } = this.server.models();
        let questions = await Question.query().eager('options');
        _.each(questions, (question) => {
            let topic = question.topic;
            if (question.difficulty == CONSTANTS.questions.difficulty.easy) {
                this.questions[topic].easy.push(question);
            } else if (question.difficulty == CONSTANTS.questions.difficulty.medium) {
                this.questions[topic].medium.push(question);
            } else {
                this.questions[topic].hard.push(question);
            }
        });
    }

    _generateAssessmentQuestions() {
        let assessmentConfig = CONSTANTS.questions.assessmentConfig;
        let questionSet = [];
        _.each(assessmentConfig, (value, topic) => {
            _.each(value, (nQuestions, diffLevel) => {
                let questions = _.sample(this.questions[topic][diffLevel], nQuestions)
                questionSet.push(questions);
            });
        });

        questionSet = _.shuffle( _.flatten(questionSet) );
        return questionSet;
    }

    async validateEnrolmentKey(key, txn=null) {
        const { EnrolmentKey } = this.server.models();

        key = await EnrolmentKey.query(txn).where({key: key});
        if (!key.length) {
            return false;
        } else {
            return key[0];
        }
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
        if (key.startTime && key.endTime) {
            return 'testAnswered';
        } else if (key.startTime && !key.endTime) {
            return 'testStarted'
        } else {
            return 'testNotStarted'
        }
    }

    async createQuestionSetForPartner(txn) {
        console.log("Hello! I am creating a question set for a partner.");
        const { QuestionSet, Question, EnrolmentKey } = this.server.models();

        let questions = this._generateAssessmentQuestions();
        let questionSet = await QuestionSet.query(txn).insert({
            questionIds: _.map(questions, (question) => {return question.id})
        });

        return {
            questionSet: questionSet,
            questions: questions
        }
    }

    async getQuestionsOfQuestionSet(questionSetId, order=false, txn=null) {
        // when order is true then this will also return the questions in a ordered format
        // it will be the same order as the order of question IDs in the question set
        const  { Question, QuestionSet } = this.server.models();

        let questionSet = await QuestionSet.query(txn).findById(questionSetId);
        let questionIds = questionSet.questionIds;
        let questions = await Question.query(txn).findByIds(questionSet.questionIds).eager('options');

        if (order) {
            questions = _.map(questionIds, (id) => { // the re-ordering needs to be done as findByIds sorts them
                let question = _.where(questions, {id: id})[0];
                return question;
            });
        }

        questionSet.questions = questions;
        return questionSet;
    }

    async getQuestionSetForEnrolmentKey(key, txn=null) {
        const { QuestionSet, Question, EnrolmentKey } = this.server.models();

        let questions, questionSet;
        if (key.questionSetId) { // the question set has already been created
            questionSet = await QuestionSet.query(txn).findById(key.questionSetId)
        }
        // TODO: start time needs to be taken into consideration and amount of time left for the student needs to be returned.
        if (questionSet) {
            questions = await Question.query(txn).findByIds(questionSet.questionIds).eager('options');
        }
        // the question set needs to be created
        else {
            questions = this._generateAssessmentQuestions();
            questionSet = await QuestionSet.query(txn).insert({
                questionIds: _.map(questions, (question) => {return question.id})
            });

            // record the start time on the enrolment key object
            await EnrolmentKey.query(txn).patch({
                startTime: new Date(),
                questionSetId: questionSet.id
            }).where({id: key.id});
        }

        console.log(this.getAnswerObjectForAPI(questions));
        return _.shuffle(questions);

    }

    _getMarksForAttempt(attemptObj) {
        let question = attemptObj.question;
        let marks = 0;
        let correctOption;
        let diffLevelStr = _.invert(CONSTANTS.questions.difficulty)[question.difficulty];
        if (question.type == CONSTANTS.questions.types.integer) {
            correctOption = question.options[0];
            if (correctOption.text == attemptObj.textAnswer) {
                marks = CONSTANTS.questions.markingScheme[diffLevelStr];
            }
        } else {
            correctOption = _.where(question.options, {correct: true})[0];
            if (correctOption.id == attemptObj.selectedOptionId) {
                marks = CONSTANTS.questions.markingScheme[diffLevelStr];
            }
        }
        return marks
    }

    getAnswerObjectForAPI(questions) {
        // helper function to help us test out the API
        let apiBody = _.object( _.map(questions, (question) => {
            let id = question.id;
            let correctOption = _.where(question.options, {correct: true})[0];
            if (question.type == CONSTANTS.questions.types.integer) {
                return [id, correctOption.text]
            } else {
                return [id, correctOption.id]
            }
        }) );
        return JSON.stringify(apiBody, null, 2);
    }

    getAttempts(answers, key, questions) {
        let totalMarks = 0;
        let attempts = _.map(_.pairs(answers), (answer) => {
            let questionId = Number(answer[0]);
            let attempt = {
                enrolmentKeyId: key.id,
                questionId: questionId,
                question: _.where(questions, { id: questionId })[0]
            }
            if (attempt.question.type == CONSTANTS.questions.types.integer) {
                attempt.textAnswer = String(answer[1]).trim();
            } else {
                attempt.selectedOptionId = Number(answer[1]);
            }
            totalMarks += this._getMarksForAttempt(attempt);
            return _.omit(attempt, 'question');
        });
        return { attempts, totalMarks }
    }

    answersAddQuestionIds(answers, questions) {
        let newAnswers = {};
        let charOptions = ['a', 'b', 'c', 'd', 'e'];
        _.each(_.pairs(answers), (a, index) => {
            let value;
            if (typeof a[1] == 'string') {
                let oIndex = charOptions.indexOf( a[1].toLowerCase() );
                value = questions[index].options[oIndex].id;
            } else {
                value = String(a[1]);
            }
            newAnswers[ questions[index].id ] = value;
        });
        return newAnswers;
    }

    async recordOfflineStudentAnswers(studentDetails, answers, questionSet, txn=null) {

        const { studentService } = this.server.services();
        const { EnrolmentKey, QuestionAttempt } = this.server.models();

        // create a student with the contacts
        let mobile = studentDetails.whatsapp
        delete studentDetails.whatsapp;
        studentDetails = studentService.swapEnumKeysWithValues(studentDetails);
        let student = await studentService.create(mobile, "completedTestWithDetails", null, studentDetails)

        // create an enrolment key for the student (mark the question set)
        let key = await EnrolmentKey.generateNewKey(student.id, questionSet.id);

        answers = this.answersAddQuestionIds(answers, questionSet.questions);
        let { attempts, totalMarks } = this.getAttempts(answers, key, questionSet.questions);
        attempts = await QuestionAttempt.query(txn).insertGraph(attempts);

        // record the total marks on the enrolment key
        await EnrolmentKey.query(txn).patch({
            totalMarks: totalMarks
        }).where({id: key.id});
    }

    async recordStudentAnswers(key, answers, txn) {

        const { QuestionAttempt, EnrolmentKey } = this.server.models();

        // check if the question IDs in the answers object and the question IDs of the set match
        let questions = await this.getQuestionSetForEnrolmentKey(key);
        let answersQuestionIds = _.map( _.keys(answers), Number );
        let ansDiff = _.difference( answersQuestionIds, _.map(questions, (question) => {return question.id}) )
        console.log(ansDiff);
        if (ansDiff.length != 0) {
            throw Boom.badRequest("All answers provided don't belong to the given question set.");
        }

        // create attempt objects to store in DB and calculate score
        let { attempts, totalMarks } = this.getAttempts(answers, key, questions);
        attempts = await QuestionAttempt.query(txn).insertGraph(attempts);

        // record the end time and total marks scored by the student
        await EnrolmentKey.query(txn).patch({
            endTime: new Date(),
            totalMarks: totalMarks
        }).where({id: key.id});

        // change the stage of the student to record student
        await this.patchStudentDetails(key, {
            stage: "completedTest"
        });

    }

    async patchStudentDetails(key, details, txn=null) {
        const { Student } = this.server.models();

        return await Student.query(txn).patch(details).where({id: key.studentId});
    }

};
