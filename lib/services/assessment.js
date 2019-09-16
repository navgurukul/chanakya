'use strict';

const Joi = require('joi');
const Schmervice = require('schmervice');
const CONSTANTS = require('../constants');
const _ = require("underscore");
const Boom = require('boom');

let internals = {}
internals.topicItemAssessmentConfigSchema = Joi.object({
    topic: Joi.string().valid(...CONSTANTS.questions.topics).required(),
    difficulty: Joi.object({
        easy: Joi.number().integer().required(),
        medium: Joi.number().integer().required(),
        hard: Joi.number().integer().required()
    }),
    sortedByDifficulty: Joi.boolean().required()
});
internals.bucketItemAssessmentConfig = Joi.object({
    bucketName: Joi.string().required()
});

internals.assessmentConfigSchema = Joi.array().items(
        internals.topicItemAssessmentConfigSchema,
        internals.bucketItemAssessmentConfig
);


module.exports = class AssessmentService extends Schmervice.Service {

    async initialize() {
        this.questions = {};
        _.each(CONSTANTS.questions.topics, (topic) => {
            this.questions[topic] = { easy: [], medium: [], hard: [] }
        });

        // validate the assessment config
        Joi.attempt(CONSTANTS.questions.assessmentConfig, internals.assessmentConfigSchema);

        // TODO: check if the correct bucket names are used in the config

        // load the questions of the current version into the memory
        const { testVersioningService } = this.server.services();
        this.currentTestVersion = await testVersioningService.findCurrent();
        this.currentQuestions = await testVersioningService.getQuestions(this.currentTestVersion);

        console.log(this.currentQuestions);

    }

    _generateAssessmentQuestions() {
        let assessmentConfig = CONSTANTS.questions.assessmentConfig;

        let questionSet = [];
        _.each(assessmentConfig, (config) => {
            // one of the bucket choices need to be picked
            if (config.bucketName) {
                let bucket = _.where(this.currentQuestions.buckets, {name: config.bucketName})[0];
                let chosenChoiceIndex = _.random( 0, bucket.choices.length-1 );
                let questions = bucket.choices[chosenChoiceIndex].questions;
                questionSet.push(questions);
            }
            // questions of the given topic of the particular difficulty level need to be picked
            else if (config.topic) {
                let topicQuestions = [];
                _.each(config.difficulty, (nQuestions, level) => {
                    let questions = _.sample(this.currentQuestions.withoutChoices[config.topic][level], nQuestions)
                    topicQuestions.push(questions);
                });
                topicQuestions = _.flatten(topicQuestions);
                if (config.sortedByDifficulty) {
                    topicQuestions = _.sortBy(topicQuestions, q => q.difficulty);
                } else {
                    topicQuestions = _.shuffle(topicQuestions);
                }
                questionSet.push(topicQuestions);
            }
        });
        return _.flatten(questionSet);
    }

    async validateEnrolmentKey(key, txn=null) {
        const { EnrolmentKey } = this.server.models();

        key = await EnrolmentKey.query(txn).where({key: key}).eager('student');
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
            questionIds: _.map(questions, (question) => {return question.id}),
            versionId: this.currentTestVersion.id
        });

        return {
            questionSet: questionSet,
            questions: questions
        }
    }

    async getQuestionsOfQuestionSet(questionSetId, txn=null) {
        const  { Question, QuestionSet } = this.server.models();
        let questionSet = await QuestionSet.query(txn).findById(questionSetId);
        let questionIds = questionSet.questionIds;
        let questions = await Question.query(txn).findByIds(questionSet.questionIds).eager('options');

        questions = _.map(questionIds, (id) => { // the re-ordering needs to be done as findByIds sorts them
            let question = _.where(questions, {id: id})[0];
            return question;
        });

        questionSet.questions = questions;
        return questionSet;
    }

    async getQuestionSetForEnrolmentKey(key, txn=null) {
        const { QuestionSet, Question, EnrolmentKey } = this.server.models();

        let questions, questionSet;
        // TODO: start time needs to be taken into consideration and amount of time left for the student needs to be returned.
        if (key.questionSetId) { // the question set has already been created
            questionSet = await this.getQuestionsOfQuestionSet(key.questionSetId);
            questions = questionSet.questions;
        }
        // the question set needs to be created
        else {
            questions = this._generateAssessmentQuestions();
            questionSet = await QuestionSet.query(txn).insert({
                questionIds: _.map(questions, (question) => {return question.id}),
                versionId: this.currentTestVersion.id
            });

            // record the start time on the enrolment key object
            await EnrolmentKey.query(txn).patch({
                startTime: new Date(),
                questionSetId: questionSet.id
            }).where({id: key.id});
        }

        console.log(this.getAnswerObjectForAPI(questions));
        return questions;

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

            let correctOption = {};
            _.each(question.options, (option, index) => {
                if (option.correct == true) {
                    correctOption = {
                        id: option.id,
                        index: index+1,
                        text: option.text
                    }
                }
            });

            if (question.type == CONSTANTS.questions.types.integer) {
                return [id, correctOption.text];
            } else {
                return [id, correctOption];
            }
        }) );

        return JSON.stringify(apiBody, null, 2);
    }

    getAttempts(answers, key, questions) {
        let totalMarks = 0;

        let attempts = _.map(questions, (q) => {
            let attempt = {
                enrolmentKeyId: key.id,
                questionId: q.id,
                question: q
            }
            if (q.type == CONSTANTS.questions.types.integer) {
                attempt.textAnswer = typeof answers[q.id] ==  'string' ? answers[q.id].trim() : null;
            } else {
                attempt.selectedOptionId = answers[q.id] == null ? null : Number(answers[q.id]);
            }
            totalMarks += this._getMarksForAttempt(attempt);
            return _.omit(attempt, 'question');
        });

        return { attempts, totalMarks }
    }

    answersAddQuestionIds(answers, questions) {
        let newAnswers = {};
        let charOptions = ['a', 'b', 'c', 'd', 'e'];
        _.each(questions, (question, index) => {
            let answerValue;
            let studentAttempt = answers[index+1];

            // return if the studentAttempt is a null
            if (studentAttempt ==  null) {
                newAnswers[ question.id ] = studentAttempt;
                return;
            }

            if (question.type == CONSTANTS.questions.types.mcq) {
                let oIndex = charOptions.indexOf( studentAttempt.toLowerCase() );
                answerValue = question.options[oIndex].id;
            } else { // question is of integer type means a single answer
                answerValue = String(studentAttempt)
            }

            newAnswers[question.id] = answerValue;
        });

        return newAnswers;
    }

    async recordOfflineStudentAnswers(studentDetails, answers, questionSet, txn=null) {
        
        // taken out and deleted typeOfTest from studentDetails and instert into enrolment_keys table.

        const { studentService } = this.server.services();
        const { EnrolmentKey, QuestionAttempt, StageTransition } = this.server.models();

        studentDetails = studentService.swapEnumKeysWithValues(studentDetails);

        let student = await studentService.create("completedTestWithDetails", null, studentDetails)

        // create an enrolment key for the student (mark the question set)
        let key = await EnrolmentKey.generateNewKey(student.id, questionSet.id);
        answers = this.answersAddQuestionIds(answers, questionSet.questions);
        let { attempts, totalMarks } = this.getAttempts(answers, key, questionSet.questions);
        attempts = await QuestionAttempt.query(txn).insertGraph(attempts);

        // record the total marks on the enrolment key
        await EnrolmentKey.query(txn).patch({
            totalMarks: totalMarks,
            typeOfTest: 'offlineTest'
        }).where({id: key.id});
    }

    async recordStudentAnswers(key, answers, txn) {

        const { QuestionAttempt, EnrolmentKey, } = this.server.models();

        // check if the question IDs in the answers object and the question IDs of the set match
        let questions = await this.getQuestionSetForEnrolmentKey(key);
        let answersQuestionIds = _.map( _.keys(answers), Number );
        let ansDiff = _.difference( answersQuestionIds, _.map(questions, (question) => {return question.id}) )
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
    async addOrUpdateWhatsappNumber(studentId, whatsappNum, txn=null) {
        // if the whatsapp number is given check if it exists in DB then mark
        // isWhatsapp as true otherwise create a new contact and mark isWhatsapp as true

        const { Contact } = this.server.models()
        let contacts = await Contact.query(txn).where({ mobile: whatsappNum, studentId: studentId });
        if(contacts.length == 0) {
            await Contact.query(txn).insert({
                mobile: whatsappNum,
                studentId: studentId,
                isWhatsapp: true
            });
        } else {
            await Contact.query(txn).patch({
                isWhatsapp: true
            }).where({ studentId: studentId, mobile: whatsappNum });
        }
    }

    async sendEnglishTestLink(mobile, stage, keyId, key, txn=null) {
        const { EnglishEnrolmentKey } = this.server.models();
        const { exotelService } = this.server.services();
        // recorde the students enrolment keyId into englishEnrolment_key table for storing students english test marks.
        // and for verifying validate enrolnment key. 
        await EnglishEnrolmentKey.query(txn).insert({
            keyId: keyId
        })
         
        let sendEnglishTestLink = await exotelService.sendSMS(mobile, stage, key);
        //  change student stage onces send the english test link.
        let enrolmentkey = await this.validateEnrolmentKey(key)
        await this.patchStudentDetails(enrolmentkey, {
            stage: "pendingEnglishTest"
        })
    }
    
    async recordStageTranisiton(student, toStage, key, txn=null){
        const { StageTransition, EnglishEnrolmentKey } = this.server.models();
        const { exotelService } = this.server.services();
        await StageTransition.query(txn).insert({
            studentId:student.id,
            fromStage:student.stage,
            toStage,
        });

            // send sms after recording the stage transitions
        if ( exotelService.hasTemplateForStage(toStage) == true ) {
            if (!student.contacts) {
                await student.$relatedQuery('contacts');
            }
            let sendSMSPromises = []
            _.each(student.contacts, contact => {
                const templateContext = {
                    student,
                    contact
                }
                sendSMSPromises.push(exotelService.sendSMS(contact.mobile, toStage, templateContext))
            })
            return await Promise.all(sendSMSPromises)
        }

    }


    async patchStudentDetails(key, details={}, txn=null) {
        const { Student } = this.server.models();
        // send English test link to student when stage is pendingEnglishInterview
        if (!details.length && key.student.stage == "pendingEnglishInterview" && key.student.contacts) {
            await this.sendEnglishTestLink(key.student.contacts[0].mobile, key.student.stage, key.id, key.key)
        }
        
        if (details.stage) {
            await this.recordStageTranisiton(key.student, details.stage, txn)
        }
        
        if (details.whatsapp) {
            let whatsapp = details.whatsapp;
            await this.addOrUpdateWhatsappNumber(key.studentId, whatsapp, txn)
            delete details.whatsapp
        }

        // patch the other details on the student table
        return await Student.query(txn).patch(details).where({id: key.studentId});
    }

    async patchStudentDetailsWithoutKeys(student, details, txn=null) {
        const { Student } = this.server.models();
        // update stage of student if specified
        if (details.stage) {
            await this.recordStageTranisiton(student, details.stage, txn)
        }
        
        if (details.whatsapp) {
            let whatsapp = details.whatsapp;
            await this.addOrUpdateWhatsappNumber(student.id, whatsapp, txn)
            delete details.whatsapp
        }

        // patch the other details on the student table
        return await Student.query(txn).patch(details).where({id: student.id});
    }
};