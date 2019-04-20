'use strict';
const Joi = require('joi');
const Boom = require('boom');
const EnrolmentKey = require('../models/enrolmentKey');
const CONSTANTS = require('../constants');
const Student = require('../models/student');

const Contact = require('../models/studentContact');
const _ = require("underscore");

const internals = {}

// helper methods
internals.validateEnrolmentKey = async function(assessmentService, key) {
    let enrolmentKey = await assessmentService.validateEnrolmentKey(key);
    if (!enrolmentKey) {
        throw Boom.badRequest("The Enrolment Key specified is wrong. Please check and try again.");
    }
    return enrolmentKey;
}
internals.ensureEnrolmentKeyStatus = function(assessmentService, key) {
    let keyStatus = assessmentService.getEnrolmentKeyStatus(key);
    if (keyStatus == 'testAnswered') {
        throw Boom.conflict("This enrolment key has already been used to answer a test.");
    }
    return keyStatus;
}

module.exports = [
    {
        method: 'GET',
        path: '/on_assessment/validate_enrolment_key/{enrolmentKey}',
        options: {
            description: "Validates the given enrolment key.",
            tags: ['api'],
            validate: {
                params: {
                    enrolmentKey: EnrolmentKey.field("key")
                }
            },
            handler: async (request, h) => {
                const { assessmentService } = request.services();

                let enrolmentKey = await assessmentService.validateEnrolmentKey(request.params.enrolmentKey);
                let keyStatus = assessmentService.getEnrolmentKeyStatus(enrolmentKey);
                if (enrolmentKey) {
                    return { valid: true, keyStatus: keyStatus }
                } else {
                    return { valid: false, keyStatus: keyStatus }
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/details/{enrolmentKey}',
        options: {
            description: "Save the details of student answering the test. Can be used in stages according to frontend.",
            tags: ['api'],
            validate: {
                params: {
                    enrolmentKey: EnrolmentKey.field("key")
                },
                payload: {
                    name: Student.field("name"),
                    gender: Joi.string().valid( ..._.keys(CONSTANTS.studentDetails.gender) ),
                    dob: Student.field("dob"),
                    whatsapp: Contact.field("mobile"),
                    email: Student.field("email"),
                    state: Student.field("state"),
                    city: Student.field("city"),
                    gpsLat: Student.field("gpsLat"),
                    gpsLong: Student.field("gpsLong"),
                    pinCode: Student.field("pinCode"),
                    qualification: Joi.string().valid( ..._.keys(CONSTANTS.studentDetails.qualification) ),
                    currentStatus: Joi.string().valid( ..._.keys(CONSTANTS.studentDetails.currentStatus) ),
                    schoolMedium: Joi.string().valid( ..._.keys(CONSTANTS.studentDetails.schoolMedium) ),
                    caste: Joi.string().valid( ..._.keys(CONSTANTS.studentDetails.caste) ),
                    religon: Joi.string().valid( ..._.keys(CONSTANTS.studentDetails.religon) ), 
                    percentageIn10th: Student.field("percentageIn10th"),
                    mathMarksIn10th: Student.field("mathMarksIn10th"),
                    percentageIn12th: Student.field("percentageIn12th"),
                    mathMarksIn12th: Student.field("mathMarksIn12th")
                }
            },
            handler: async (request, h) => {
                const { assessmentService, studentService } = request.services();
                // console.log(studentService)
                let enrolmentKey = await internals.validateEnrolmentKey(assessmentService, request.params.enrolmentKey);
                // console.log(enrolmentKey)

                let payload = studentService.swapEnumKeysWithValues(request.payload);

                // patch the student row
                await assessmentService.patchStudentDetails(enrolmentKey, payload);
                // console.log(payload)

                return {'sucess': true}
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/questions/{enrolmentKey}',
        options: {
            description: "Get the questions associated with the given enrolment key. Starts the timer of the alloted time for the test.",
            tags: ['api'],
            validate: {
                params: {
                    enrolmentKey: EnrolmentKey.field("key")
                }
            },
            handler: async (request, h) => {
                const { assessmentService } = request.services();
                let enrolmentKey = await internals.validateEnrolmentKey(assessmentService, request.params.enrolmentKey);
                internals.ensureEnrolmentKeyStatus(assessmentService, enrolmentKey);

                let questions = await assessmentService.getQuestionSetForEnrolmentKey(enrolmentKey);
                console.log( _.map(questions, q => q.id) );
                return {
                    'data': questions,
                    'availableTime': CONSTANTS.questions.timeAllowed
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/on_assessment/questions/{enrolmentKey}/answers',
        options: {
            description: "Saves the answers given by the student. Saves the end time of the test.",
            tags: ['api'],
            validate: {
                options: {
                    allowUnknown: true
                },
                params: {
                    enrolmentKey: EnrolmentKey.field("key")
                },
                payload: Joi.object()
            },
            handler: async (request, h) => {
                const { assessmentService } = request.services();

                // swap empty strings with nulls
                let payload = _.object( _.map(_.pairs(request.payload), (x) => {
                    return [ x[0], x[1] == "" ? null : x[1] ]
                }) );

                let enrolmentKey = await internals.validateEnrolmentKey(assessmentService, request.params.enrolmentKey);
                internals.ensureEnrolmentKeyStatus(assessmentService, enrolmentKey);

                await assessmentService.recordStudentAnswers(enrolmentKey, payload);
                
                return { success: true };
            }
        }
    }
];