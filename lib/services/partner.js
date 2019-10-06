
const Schmervice = require('schmervice');
const Papa = require('papaparse');
const axios = require('axios');
const Joi = require('joi');
const Boom = require('boom');
const _ = require('underscore');

const Student = require('../models/student');
const Contact = require('../models/studentContact');
const CONSTANTS = require('../constants');
const { createTestAndAnswerKeyPDF } = require('../helpers/pdfGenerator');

const internals = {};
internals.csvRowAttrsSchema = Joi.object({
  name: Student.field('name'),
  gender: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.gender)).lowercase().required(),
  dob: Student.field('dob').allow(null),
  whatsapp: Contact.field('mobile').allow(null),
  mobile: Contact.field('mobile'),
  email: Student.field('email').allow(null),
  state: Joi.string().valid(..._.values(CONSTANTS.studentDetails.states)).required(),
  city: Student.field('city').allow(null),
  pinCode: Student.field('pinCode').allow(null),
  qualification: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.qualification)).allow(null),
  currentStatus: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.currentStatus)).allow(null),
  caste: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.caste)).allow(null),
  religon: Joi.string().valid(..._.keys(CONSTANTS.studentDetails.religon)).allow(null),

  percentageIn10th: Joi.alternatives().when('qualification', {
    is: 'lessThan10th',
    then: Joi.string().allow(null),
    otherwise: Joi.string().required(),
  }),

  mathMarksIn10th: Joi.alternatives().when('qualification', {
    is: 'lessThan10th',
    then: Joi.string().allow(null),
    otherwise: Joi.string().required(),
  }),

  percentageIn12th: Joi.alternatives()
    .when('qualification', {
      is: 'class12th',
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    })
    .when('qualification', {
      is: 'graduate',
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),

  mathMarksIn12th: Joi.alternatives()
    .when('qualification', {
      is: 'class12th',
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    })
    .when('qualification', {
      is: 'graduate',
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),
});
internals.stateOppMapping = _.object(_.map(_.pairs(CONSTANTS.studentDetails.states), (s) => [s[1], s[0]]));
internals.csvRequiredHeaders = [
  'name',
  'gender',
  'dob',
  'mobile',
  'whatsapp',
  'email',
  'state',
  'city',
  'qualification',
  'currentStatus',
  'caste',
  'religon',
  'pinCode',
];
internals.generateCharRangeFromAscii = (asciiCode, lastAsciiCode) => {
  const optionRangeAscii = _.range(asciiCode, asciiCode + lastAsciiCode, 1);
  return _.map(optionRangeAscii, (elem) => String.fromCharCode(elem));
};
module.exports = class PartnerService extends Schmervice.Service {
  async findById(id, eagerExpr = null, txn = null) {
    const { Partner } = this.server.models();
    let query = Partner.query(txn).throwIfNotFound().findById(id);
    if (eagerExpr) {
      query = query.eager(eagerExpr);
    }
    return await query;
  }

  async findByName(name, eagerExpr = null, txn = null) {
    const { Partner } = this.server.models();
    let query = Partner.query(txn).where('name', name);
    if (eagerExpr) {
      query = query.eager(eagerExpr);
    }
    return await query;
  }

  async findPartnerById(id, notIn = false) {
    const { Partner } = this.server.models();
    const q = Partner.query();
    if (Array.isArray(id)) {
      if (notIn) {
        return await q.whereNotIn('id', id);
      }
      return await q.whereIn('id', id);
    }
    if (notIn) {
      return await q.whereNotIn('id', id);
    }
    return await q.where({ id });
  }

  async findAll(txn) {
    const { Partner } = this.server.models();
    return await Partner.query(txn);
  }

  async update(id, details, txn = null) {
    const { Partner } = this.server.models();
    return await Partner.query(txn).update(details).where({ id });
  }

  async create(details, txn = null) {
    const { Partner } = this.server.models();
    const partners = await this.findByName(details.name, txn);
    if (partners.length > 0) {
      throw Boom.conflict(`Duplicate entry for partner with name ${partners[0].name} already exists.`, partners[0]);
    }
    return await Partner.query(txn).insert(details);
  }

  async createAssessment(partner, assessmentName, txn = null) {
    const { PartnerAssessment } = this.server.models();
    const { assessmentService } = this.server.services();

    const { questions, questionSet } = await assessmentService.createQuestionSetForPartner();
    const { questionPaperUrl, answerKeyUrl } = await createTestAndAnswerKeyPDF(questions, partner.name, assessmentName);
    const partnerAssessment = await PartnerAssessment.query(txn).insertGraph({
      name: assessmentName,
      questionSetId: questionSet.id,
      partnerId: partner.id,
      assessmentUrl: questionPaperUrl,
      answerKeyUrl,
    });

    return partnerAssessment;
  }

  async _parseCSV(csvUrl) {
    let csvData = await axios.get(csvUrl);
    csvData = csvData.data;
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transform: (value, header) => {
        if (!value) {
          return null;
        }
        return value;
      },
    });

    return results;
  }

  _validateCSV(csvResults, partnerAssessment, questionSet) {
    // prepare the final object to be returned
    const response = {
      missingHeaders: [],
      csvParsingError: false,
      data: [],
    };

    // check if all the required headers are prevent
    const firstRow = csvResults.data[0];
    const headers = _.keys(firstRow);

    response.missingHeaders = _.filter(internals.csvRequiredHeaders, (columnName) => {
      if (headers.indexOf(columnName) > -1) {
        return false;
      }
      return true;
    });

    // return and don't proceed to parsing every row if the required headers are not present
    if (response.missingHeaders.length > 0) {
      response.csvParsingError = true;
      return response;
    }

    // Joi schema for the question answers specified in the CSV
    // This is dynamic as it will depend on the questions of the question set
    const questionAnswersSchema = _.object(_.map(questionSet.questions, (question, index) => {
      if (question.type == CONSTANTS.questions.types.integer) {
        return [String(index + 1), Joi.number().allow(null)];
      }
      const optionsRange = [
        ...internals.generateCharRangeFromAscii(65, question.options.length),
        ...internals.generateCharRangeFromAscii(97, question.options.length),
      ];
      return [String(index + 1), Joi.string().valid(optionsRange).allow(null)];
    }));

    // iterate over every row of the csv and check if it is correct (not malformed)
    response.data = _.map(csvResults.data, (row, index) => {
      row = _.object(_.map(_.pairs(row), (row) => {
        let value = row[1];
        if (value) {
          value = value.trim();
        }
        return [row[0], value];
      }));

      const obj = {
        detailErrors: null,
        answerErrors: null,
        csvRowNumber: index + 1,
        data: {},
      };

      // parse the student details
      const studentDetails = Joi.validate(row, internals.csvRowAttrsSchema, {
        stripUnknown: true,
        abortEarly: false,
      });
      if (!studentDetails.error) {
        obj.data.details = studentDetails.value;
      } else {
        response.csvParsingError = true;
        obj.detailErrors = _.map(studentDetails.error.details, (err) => err.message);
      }
      // parse the answers
      const answers = Joi.validate(row, questionAnswersSchema, {
        stripUnknown: true,
        abortEarly: false,
      });
      if (!answers.error) {
        obj.data.answers = answers.value;
      } else {
        response.csvParsingError = true;
        obj.answerErrors = _.map(answers.error.details, (err) => err.message);
      }
      return obj;
    });
    return response;
  }

  async recordAssessmentDetails(partner, assessmentId, csvUrl, txn = null) {
    const { assessmentService } = this.server.services();
    const { PartnerAssessment } = this.server.models();

    const csvResults = await this._parseCSV(csvUrl);
    // throw a boom error in case there is any error
    if (csvResults.errors.length > 0) {
      return csvResults.errors;
    }

    // get the questions of the attached questions in the right order
    const partnerAssessment = await PartnerAssessment.query(txn).findById(assessmentId).eager('partner');
    const questionSet = await assessmentService.getQuestionsOfQuestionSet(partnerAssessment.questionSetId);

    // iterate over every row of the csv and check if it is correct (not malformed)
    const data = this._validateCSV(csvResults, partnerAssessment, questionSet);
    if (data.csvParsingError) {
      return data;
    }

    // add the student details & answers in the DB
    const promises = _.map(data.data, (student) => {
      student.data.details.partnerId = partner.id;
      if (student.data.details.state) {
        student.data.details.state = internals.stateOppMapping[student.data.details.state];
      }
      return assessmentService.recordOfflineStudentAnswers(student.data.details, student.data.answers, questionSet);
    });
    return Promise.all(promises);
  }
};
