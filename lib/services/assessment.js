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

    async getQuestionSetForEnrolmentKey(key, txn=null) {
        const { QuestionSet, Question, EnrolmentKey } = this.server.models();

        let questions, questionSet;
        questionSet = await QuestionSet.query(txn).findOne({ enrolmentKeyId: key.id });
        // the question has already been created
        // TODO: start time needs to be taken into consideration and amount of time left for the student needs to be returned.
        if (questionSet) {
            questions = await Question.query(txn).findByIds(questionSet.questionIds).eager('options');
        }
        // the question set needs to be created
        else {
            questions = this._generateAssessmentQuestions();
            questionSet = await QuestionSet.query(txn).insert({
                enrolmentKeyId: key.id,
                questionIds: _.map(questions, (question) => {return question.id})
            });

            // record the start time on the enrolment key object
            await EnrolmentKey.query(txn).patch({ startTime: new Date() }).where({id: key.id});
        }

        // console.log(this.getAnswerObjectForAPI(questions));
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
        return JSON.stringify({answers: apiBody}, null, 2);
    }

    async recordStudentAnswers(key, answers, txn) {

        const { QuestionAttempt, EnrolmentKey } = this.server.models();

        // check if the question IDs in the answers object and the question IDs of the set match
        let questions = await this.getQuestionSetForEnrolmentKey(key);
        let answersQuestionIds = _.map( _.keys(answers), Number );
        let ansDiff = _.difference( answersQuestionIds, _.map(questions, (question) => {return question.id}) )
        if (ansDiff.length != 0) {
            throw Boom.badRequest("All answers provided don't belong to the given question set.");
        }

        // create attempt objects to store in DB and calculate score
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
        attempts = await QuestionAttempt.query(txn).insertGraph(attempts);

        // record the end time and total marks scored by the student
        await EnrolmentKey.query(txn).patch({
            endTime: new Date(),
            totalMarks: totalMarks
        }).where({id: key.id});

    }

    async pathStudentDetails(key, details, txn=null) {
        const { Student } = this.server.models();

        return await Student.query(txn).patch(details).where({id: key.studentId});
    }

};
