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
const { val } = require('objection');
const { count } = require('code');
const { constant } = require('underscore');
const logger = require('../../server/logger');

const internals = {};
internals.csvRowAttrsSchema = Joi.object({
  name: Student.field('name'),
  gender: Joi.string()
    .valid(..._.keys(CONSTANTS.studentDetails.gender))
    .lowercase()
    .required(),
  dob: Student.field('dob').allow(null),
  whatsapp: Contact.field('mobile').allow(null),
  mobile: Contact.field('mobile'),
  email: Student.field('email').allow(null),
  state: Joi.string()
    .valid(..._.values(CONSTANTS.studentDetails.states))
    .required(),
  city: Student.field('city').allow(null),
  district: Student.field('district').allow(null),
  pin_code: Student.field('pin_code').allow(null),
  qualification: Joi.string()
    .valid(..._.keys(CONSTANTS.studentDetails.qualification))
    .allow(null),
  current_status: Joi.string()
    .valid(..._.keys(CONSTANTS.studentDetails.currentStatus))
    .allow(null),
  caste: Joi.string()
    .valid(..._.keys(CONSTANTS.studentDetails.caste))
    .allow(null),
  religon: Joi.string()
    .valid(..._.keys(CONSTANTS.studentDetails.religon))
    .allow(null),

  percentage_in10th: Joi.when('qualification', {
    is: 'lessThan10th',
    then: Joi.string().allow(null),
    otherwise: Joi.string(),
  }),

  math_marks_in10th: Joi.when('qualification', {
    is: 'lessThan10th',
    then: Joi.string().allow(null),
    otherwise: Joi.string(),
  }),

  percentage_in12th: Joi.when('qualification', {
    is: 'class12th',
    then: Joi.string(),
    otherwise: Joi.string().allow(null),
  }).when('qualification', {
    is: 'graduate',
    then: Joi.string(),
    otherwise: Joi.string().allow(null),
  }),

  math_marks_in12th: Joi.when('qualification', {
    is: 'class12th',
    then: Joi.string(),
    otherwise: Joi.string().allow(null),
  }).when('qualification', {
    is: 'graduate',
    then: Joi.string(),
    otherwise: Joi.string().allow(null),
  }),
});

internals.stateOppMapping = _.object(
  _.map(_.pairs(CONSTANTS.studentDetails.states), (s) => [s[1], s[0]])
);
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
  'current_status',
  'caste',
  'religon',
  'pin_code',
];
internals.generateCharRangeFromAscii = (asciiCode, lastAsciiCode) => {
  const optionRangeAscii = _.range(asciiCode, asciiCode + lastAsciiCode, 1);
  return _.map(optionRangeAscii, (elem) => String.fromCharCode(elem));
};
module.exports = class PartnerService extends Schmervice.Service {
  async insertPartnerUser(partner_id, emails) {
    const { PartnerUser } = this.server.models();
    try {
      for (var i of emails) {
        await PartnerUser.query().insert({ email: i.email, partner_id });
      }
    } catch (err) {
      logger.error(JSON.stringify(err));
      console.log(err);
    }
  }
  async updatePartnerUser(emails) {
    const { PartnerUser } = this.server.models();
    try {
      for (var i of emails) {
        if (i.id) {
          await PartnerUser.query().update(i).where('id', i.id);
        } else {
          await PartnerUser.query().insert({
            email: i.email,
            partner_id: i.partner_id,
          });
        }
      }
    } catch (err) {
      logger.error(JSON.stringify(err));
      console.log(err);
    }
  }
  async findById(id, eagerExpr = null, txn = null) {
    const { Partner } = this.server.models();
    let query = Partner.query(txn).throwIfNotFound().findById(id).withGraphFetched('partnerUser');

    if (eagerExpr) {
      query = query.withGraphFetched(eagerExpr);
    }
    const result = await query;
    return result;
  }

  async findBySlug(slug) {
    const { Partner } = this.server.models();
    let result;
    try {
      result = await Partner.query().where('slug', slug);
    } catch (err) {
      logger.error(JSON.stringify(err));
      return [err, null]
    }
    return [null, result];
  }

  async findByEnrolmentKey(enrolmentKey) {
    const { EnrolmentKey } = this.server.models();
    const query = await EnrolmentKey.query()
      .throwIfNotFound()
      .where('key', enrolmentKey)
      .withGraphFetched('partner');
    if (Object.keys(query[0].partner).length > 0) {
      return query[0].partner;
    }
    throw Boom.notFound('Partner not found for the student');
  }

  async findByStudentId(studentId) {
    const { Student } = this.server.models();
    let result;
    try {
      result = await Student.query()
        .throwIfNotFound()
        .where('id', studentId)
        .withGraphFetched('partner');
    } catch (err) {
      if (err) {
        logger.error(JSON.stringify(err));
        return { message: err.message, error: true };
      }
    }
    return result[0].partner;
  }

  async findByName(name, eagerExpr = null, txn = null) {
    const { Partner } = this.server.models();
    let query = Partner.query(txn).where('name', name);
    if (eagerExpr) {
      query = query.withGraphFetched(eagerExpr);
    }
    const result = await query;
    return result;
  }

  async findPartnerById(id, notIn = false) {
    const { Partner } = this.server.models();
    const q = Partner.query();
    if (Array.isArray(id)) {
      if (notIn) {
        const result = await q.whereNotIn('id', id);
        return result;
      }
      const result = await q.whereIn('id', id);
      return result;
    }
    if (notIn) {
      const result = await q.whereNotIn('id', id);
      return result;
    }
    const result = await q.where({ id });
    return result;
  }

  async findAll(txn) {
    const { Partner } = this.server.models();
    const partner = await Partner.query(txn).withGraphFetched('partnerUser');
    return partner;
  }

  async update(id, details, txn = null) {
    const { Partner } = this.server.models();
    if (details.districts) {
      details.districts = val(details.districts).asArray().castTo('text[]');
    }
    if (details['partnerUser']) {
      delete details['partnerUser'];
    }
    const updatePartner = await Partner.query(txn).update(details).where({ id });
    return updatePartner;
  }

  async create(details, txn = null) {
    const { Partner } = this.server.models();

    const validateSlug = /^[a-z0-9-]+$/;
    if (!validateSlug.test(details.slug)) {
      throw Boom.conflict('Invalide slug, set slug as minimum small letter character and number');
    }

    const partners = await this.findByName(details.name, txn);
    if (partners.length > 0) {
      throw Boom.conflict(
        `Duplicate entry for partner with name ${partners[0].name} already exists.`,
        partners[0]
      );
    }
    const { districts, ...exceptDistricts } = details;
    // Inserting an array using objection needs casting or else it will throw an error saying 'malformed array literal'
    const withDistricts = {
      ...exceptDistricts,
      districts: val(districts).asArray().castTo('text[]'),
    };
    await Partner.query(txn).insert(withDistricts);
    const insertedData = await Partner.query().where({ slug: details.slug });
    await this.partnerSpecificLink('web', insertedData[0].id);
    return this.partnerSpecificLink('android', insertedData[0].id);
  }

  async createAssessment(partner, assessmentName, txn = null) {
    const { PartnerAssessment } = this.server.models();
    const { assessmentService } = this.server.services();

    const { questions, questionSet } = await assessmentService.createQuestionSetForPartner();
    const { questionPaperUrl, answer_key_url } = await createTestAndAnswerKeyPDF(
      questions,
      partner.name,
      assessmentName
    );
    const partnerAssessment = await PartnerAssessment.query(txn).insertGraph({
      name: assessmentName,
      question_set_id: questionSet.id,
      partner_id: partner.id,
      assessment_url: questionPaperUrl,
      answer_key_url,
    });

    return partnerAssessment;
  }

  async parseCSV(csvUrl) {
    let csvData = await axios.get(csvUrl);
    csvData = csvData.data;
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transform: (value) => {
        if (!value) {
          return null;
        }
        return value;
      },
    });

    return results;
  }

  validateCSV(csvResults, partnerAssessment, questionSet) {
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
    const baseQuestionSchema = {};
    _.map(questionSet.questions, (question, index) => {
      if (question.type === CONSTANTS.questions.types.integer) {
        baseQuestionSchema[String(index + 1)] = Joi.number().allow(null);
        return 0;
      }
      const optionsRange = [
        ...internals.generateCharRangeFromAscii(65, question.options.length),
        ...internals.generateCharRangeFromAscii(97, question.options.length),
      ];
      baseQuestionSchema[String(index + 1)] = Joi.string()
        .valid(...optionsRange)
        .allow(null);

      return 0;
    });
    const questionAnswersSchema = Joi.object({ ...baseQuestionSchema });

    // iterate over every row of the csv and check if it is correct (not malformed)
    response.data = _.map(csvResults.data, (Row, index) => {
      let row = Row;
      row = _.object(
        _.map(_.pairs(row), (rows) => {
          let value = rows[1];
          if (value) {
            value = value.trim();
          }
          return [rows[0], value];
        })
      );

      const obj = {
        detailErrors: null,
        answerErrors: null,
        csvRowNumber: index + 1,
        data: {},
      };

      // parse the student details
      const studentDetails = internals.csvRowAttrsSchema.validate(row, {
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
      const answers = questionAnswersSchema.validate(row, {
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

    const csvResults = await this.parseCSV(csvUrl);
    // throw a boom error in case there is any error
    if (csvResults.errors.length > 0) {
      return csvResults.errors;
    }

    // get the questions of the attached questions in the right order
    const partnerAssessment = await PartnerAssessment.query(txn)
      .findById(assessmentId)
      .withGraphFetched('partner');
    const questionSet = await assessmentService.getQuestionsOfQuestionSet(
      partnerAssessment.question_set_id
    );

    // iterate over every row of the csv and check if it is correct (not malformed)
    const data = this.validateCSV(csvResults, partnerAssessment, questionSet);
    if (data.csvParsingError) {
      return data;
    }

    // add the student details & answers in the DB
    const promises = _.map(data.data, (stuDent) => {
      const student = stuDent;
      student.data.details.partner_id = partner.id;
      if (student.data.details.state) {
        student.data.details.state = internals.stateOppMapping[student.data.details.state];
      }
      return assessmentService.recordOfflineStudentAnswers(
        student.data.details,
        student.data.answers,
        questionSet
      );
    });
    return Promise.all(promises);
  }
  async getProgressMadeForGraph(partner_id) {
    const graph = {
      selectedAndJoiningAwaited: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      offerLetterSent: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingTravelPlanning: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      finalisedTravelPlans: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      finallyJoined: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      deferredJoining: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingAlgebraInterview: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingEnglishInterview: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingCultureFitInterview: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingParentConversation: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      becameDisIntersested: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      notReachable: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      testFailed: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      englishInterviewFail: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      algebraInterviewFail: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      tuitionGroup: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
    };
    const output = [];
    const { Student } = this.server.models();
    let total = 0;
    const students = await Student.query()
      .withGraphFetched({ contacts: true })
      .where('partner_id', partner_id)
      .orderBy('created_at', 'desc')
      .withGraphFetched('feedbacks');

    _.each(students, (student) => {
      const { stage, name } = student;
      if (graph[stage]) {
        total += 1;
        graph[stage].value += 1;
        graph[stage].studentNames.push(name);
      }
    });
    for (const i in graph) {
      graph[i].percentage = (graph[i].value / total) * 100;
      output.push({ name: i, ...graph[i] });
    }
    return output;
  }

  async progressMade(partner_id) {
    // console.log("calling progressMade");
    const { Student } = this.server.models();

    const convertedData = {
      'Selected for Navgurukul One-year Fellowship': {
        selectedAndJoiningAwaited: [],
        offerLetterSent: [],
        pendingTravelPlanning: [],
        finalisedTravelPlans: [],
        finallyJoined: [],
        deferredJoining: [],
      },
      'Need Action': {
        pendingAlgebraInterview: [],
        pendingEnglishInterview: [],
        pendingCultureFitInterview: [],
        pendingParentConversation: [],
      },
      'Need Your Help': {
        becameDisIntersested: [],
        notReachable: [],
      },
      'Failed Students': {
        testFailed: [],
        englishInterviewFail: [],
        algebraInterviewFail: [],
        tuitionGroup: [],
      },
    };

    const students = await Student.query()
      .withGraphFetched({ contacts: true })
      .where('partner_id', partner_id)
      .orderBy('created_at', 'desc')
      .withGraphFetched('feedbacks');

    _.each(students, (student) => {
      const { stage } = student;
      const data = {};

      data.name = student.name;
      data.mobile = student.contacts.length > 0 ? student.contacts[0].mobile : null;
      data.stage = student.stage;
      data.status = student.feedbacks ? student.feedbacks.state : null;
      if (
        stage === 'finallyJoined' ||
        stage === 'finalisedTravelPlans' ||
        stage === 'pendingTravelPlanning' ||
        stage === 'deferredJoining' ||
        stage === 'selectedAndJoiningAwaited' ||
        stage === 'offerLetterSent'
      ) {
        convertedData['Selected for Navgurukul One-year Fellowship'][stage].push(data);
      }
      if (
        stage == 'pendingAlgebraInterview' ||
        stage == 'pendingCultureFitInterview' ||
        stage == 'pendingEnglishInterview' ||
        stage == 'pendingParentConversation'
      ) {
        convertedData['Need Action'][stage].push(data);
      }
      if (stage == 'becameDisIntersested' || stage == 'notReachable') {
        convertedData['Need Your Help'][stage].push(data);
      }
      if (
        stage == 'testFailed' ||
        stage == 'englishInterviewFail' ||
        stage == 'algebraInterviewFail' ||
        stage == 'tuitionGroup'
      ) {
        convertedData['Failed Students'][stage].push(data);
      }
    });

    return convertedData;
  }
  async partnerSpecificLink(platform, partner_id) {
    const { Partner } = this.server.models();
    const partner = await Partner.query().where('id', partner_id);
    const partnerName = encodeURIComponent(partner[0].name).replace(/%20/g, '+');
    let merakiLink;
    if (platform === 'web') {
      merakiLink = `${CONSTANTS.web_link_url}${partner_id}`;
    } else if (platform === 'android') {
      merakiLink = `${CONSTANTS.meraki_link_url}${partner_id}`;
    }
    merakiLink = merakiLink.replace('partner_name', partnerName);
    let merakiShortLink;
    try {
      merakiShortLink = await axios.post(
        'https://api-ssl.bitly.com/v4/shorten',
        {
          long_url: merakiLink,
          domain: 'bit.ly',
        },
        {
          headers: {
            Authorization: `Bearer ${CONSTANTS.bitly.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (err) {
      logger.error(JSON.stringify(err));
      return { error: true, err: err, message: 'Something went wrong.' };
    }
    if (platform === 'web') {
      return Partner.query()
        .throwIfNotFound()
        .patchAndFetchById(partner_id, { web_link: merakiShortLink.data.link });
    }
    return Partner.query().throwIfNotFound().patchAndFetchById(partner_id, {
      meraki_link: merakiShortLink.data.link,
    });
  }

  async student_progressMade(partner_id) {
    const { Student } = this.server.models();
    const { studentService } = this.server.services();
    let students = await Student.query()
      .withGraphFetched({
        partner: true,
        contacts: true,
        enrolmentKey: true,
        partnerAssessment: true,
        lastTransition: true,
        feedbacks: true,
        feedback: true,
        campus: true,
        studentDonor: true,
      })
      .where('partner_id', partner_id)
      .orderBy('created_at', 'desc');
    students = students.filter((student) => student.campus.length > 0);
    students = await studentService.addStudentDetails(students);
    return students;
  }
  async PartnerIdsFromPartnerGroupId(partner_group_id) {
    const { PartnerRelation } = this.server.models();
    return await PartnerRelation.query().where({ partner_group_id });
  }
  async student_progressMadeParterGroup(partner_group_id) {
    const partnerIds = await this.PartnerIdsFromPartnerGroupId(partner_group_id);
    var result = [];
    for (var partner_id of partnerIds) {
      const data = await this.student_progressMade(partner_id.partner_id);
      result = [...result, ...data];
    }
    return result;
  }

  async getProgressMadeForGraphForPartnerGroup(students) {
    const graph = {
      selectedAndJoiningAwaited: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      offerLetterSent: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingTravelPlanning: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      finalisedTravelPlans: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      finallyJoined: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      deferredJoining: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingAlgebraInterview: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingEnglishInterview: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingCultureFitInterview: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      pendingParentConversation: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      becameDisIntersested: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      notReachable: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      testFailed: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      englishInterviewFail: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      algebraInterviewFail: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
      tuitionGroup: {
        value: 0,
        studentNames: [],
        percentage: 0,
      },
    };
    const output = [];
    let total = 0;

    _.each(students, (student) => {
      const { stage, name } = student;
      if (graph[stage]) {
        total += 1;
        graph[stage].value += 1;
        graph[stage].studentNames.push(name);
      }
    });
    for (const i in graph) {
      graph[i].percentage = (graph[i].value / total) * 100;
      output.push({ name: i, ...graph[i] });
    }
    return output;
  }
  async getStudentsForPartnerGroup(partner_group_id) {
    const { Student } = this.server.models();
    const partners = await this.PartnerIdsFromPartnerGroupId(partner_group_id);
    const partner_ids = [];
    for (var partner of partners) {
      partner_ids.push(partner.partner_id);
    }
    const students = await Student.query()
      .withGraphFetched({ contacts: true })
      .whereIn('partner_id', partner_ids)
      .orderBy('created_at', 'desc')
      .withGraphFetched('feedbacks');
    return await this.getProgressMadeForGraphForPartnerGroup(students);
  }

  async progressMadeForParterGroup(partner_group_id) {
    // console.log("calling progressMade");
    const { Student } = this.server.models();

    const convertedData = {
      'Selected for Navgurukul One-year Fellowship': {
        selectedAndJoiningAwaited: [],
        offerLetterSent: [],
        pendingTravelPlanning: [],
        finalisedTravelPlans: [],
        finallyJoined: [],
        deferredJoining: [],
      },
      'Need Action': {
        pendingAlgebraInterview: [],
        pendingEnglishInterview: [],
        pendingCultureFitInterview: [],
        pendingParentConversation: [],
      },
      'Need Your Help': {
        becameDisIntersested: [],
        notReachable: [],
      },
      'Failed Students': {
        testFailed: [],
        englishInterviewFail: [],
        algebraInterviewFail: [],
        tuitionGroup: [],
      },
    };

    const partners = await this.PartnerIdsFromPartnerGroupId(partner_group_id);
    const partner_ids = [];
    for (var partner of partners) {
      partner_ids.push(partner.partner_id);
    }
    const students = await Student.query()
      .withGraphFetched({ contacts: true })
      .whereIn('partner_id', partner_ids)
      .orderBy('created_at', 'desc')
      .withGraphFetched('feedbacks');

    _.each(students, (student) => {
      const { stage } = student;
      const data = {};

      data.name = student.name;
      data.mobile = student.contacts.length > 0 ? student.contacts[0].mobile : null;
      data.stage = student.stage;
      data.status = student.feedbacks ? student.feedbacks.state : null;
      if (
        stage === 'finallyJoined' ||
        stage === 'finalisedTravelPlans' ||
        stage === 'pendingTravelPlanning' ||
        stage === 'deferredJoining' ||
        stage === 'selectedAndJoiningAwaited' ||
        stage === 'offerLetterSent'
      ) {
        convertedData['Selected for Navgurukul One-year Fellowship'][stage].push(data);
      }
      if (
        stage == 'pendingAlgebraInterview' ||
        stage == 'pendingCultureFitInterview' ||
        stage == 'pendingEnglishInterview' ||
        stage == 'pendingParentConversation'
      ) {
        convertedData['Need Action'][stage].push(data);
      }
      if (stage == 'becameDisIntersested' || stage == 'notReachable') {
        convertedData['Need Your Help'][stage].push(data);
      }
      if (
        stage == 'testFailed' ||
        stage == 'englishInterviewFail' ||
        stage == 'algebraInterviewFail' ||
        stage == 'tuitionGroup'
      ) {
        convertedData['Failed Students'][stage].push(data);
      }
    });

    return convertedData;
  }
  async getNameForPartnerGroup(partner_group_id) {
    const { PartnerGroup } = this.server.models();

    return await PartnerGroup.query().where({ id: partner_group_id });
  }

  async partners_students_data_after_calculate() {
    const { Student, Partner } = this.server.models();
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    let container = [];
    try {
      const partners = await Partner.query().select('name', 'id', 'districts');
      for (const i of partners) {

        const knex = Student.knex();

        const query = knex('main.students')
          .select([
            knex.raw('COUNT(*) AS total_students'),
            knex.raw('SUM(CASE WHEN stage = \'enrolmentKeyGenerated\' THEN 1 ELSE 0 END) AS enrolment_key_generated_count'),
            knex.raw('SUM(CASE WHEN stage = \'createdStudentWithoutExam\' THEN 1 ELSE 0 END) AS created_student_without_exam_count'),
            knex.raw('SUM(CASE WHEN stage = \'basicDetailsEntered\' THEN 1 ELSE 0 END) AS basic_details_entered_count'),
            knex.raw('SUM(CASE WHEN stage = \'pendingEnglishInterview\' THEN 1 ELSE 0 END) AS pending_english_interview_count'),
            knex.raw('SUM(CASE WHEN stage = \'englishInterviewFail\' THEN 1 ELSE 0 END) AS english_interview_fail_count'),
            knex.raw('SUM(CASE WHEN stage = \'pendingAlgebraInterview\' THEN 1 ELSE 0 END) AS pending_algebra_interview_count'),
            knex.raw('SUM(CASE WHEN stage = \'algebraInterviewFail\' THEN 1 ELSE 0 END) AS algebra_interview_fail_count'),
            knex.raw('SUM(CASE WHEN stage = \'pendingCultureFitInterview\' THEN 1 ELSE 0 END) AS pending_culturefit_interview_count'),
            knex.raw('SUM(CASE WHEN stage = \'cultureFitInterviewFail\' THEN 1 ELSE 0 END) AS culturefit_interview_fail_count'),
            knex.raw('SUM(CASE WHEN stage = \'pendingParentConversation\' THEN 1 ELSE 0 END) AS pending_parent_conversation_count'),
            knex.raw('SUM(CASE WHEN stage = \'parentConversationFail\' THEN 1 ELSE 0 END) AS parent_conversation_fail_count'),
            knex.raw('SUM(CASE WHEN stage = \'selectedAndJoiningAwaited\' THEN 1 ELSE 0 END) AS selected_and_joining_awaited_count'),
            knex.raw('SUM(CASE WHEN stage = \'offerLetterSent\' THEN 1 ELSE 0 END) AS offer_letter_sent'),
            knex.raw('SUM(CASE WHEN stage = \'pendingTravelPlanning\' THEN 1 ELSE 0 END) AS pending_travel_planning_count'),
            knex.raw('SUM(CASE WHEN stage = \'finalisedTravelPlans\' THEN 1 ELSE 0 END) AS finalised_travel_plans_count'),
            knex.raw('SUM(CASE WHEN stage = \'deferredJoining\' THEN 1 ELSE 0 END) AS deferred_joining_count'),
            knex.raw('SUM(CASE WHEN stage = \'becameDisIntersested\' THEN 1 ELSE 0 END) AS became_dis_intersested_count'),
            knex.raw('SUM(CASE WHEN stage = \'finallyJoined\' THEN 1 ELSE 0 END) AS finally_joined_count'),
            knex.raw('SUM(CASE WHEN stage = \'M1\' THEN 1 ELSE 0 END) AS english_quarantine_count'),
            knex.raw('SUM(CASE WHEN stage = \'M2\' THEN 1 ELSE 0 END) AS dry_run_count'),
            knex.raw('SUM(CASE WHEN stage = \'M3\' THEN 1 ELSE 0 END) AS if_else_count'),
            knex.raw('SUM(CASE WHEN stage = \'M4\' THEN 1 ELSE 0 END) AS loop_count'),

            knex.raw('SUM(CASE WHEN stage = \'M5\' THEN 1 ELSE 0 END) AS lists'),
            knex.raw('SUM(CASE WHEN stage = \'M6\' THEN 1 ELSE 0 END) AS functions'),
            knex.raw('SUM(CASE WHEN stage = \'M7\' THEN 1 ELSE 0 END) AS python_complete'),
            knex.raw('SUM(CASE WHEN stage = \'M8\' THEN 1 ELSE 0 END) AS hangman_requests_more'),
            knex.raw('SUM(CASE WHEN stage = \'M9\' THEN 1 ELSE 0 END) AS web_scraping'),
            knex.raw('SUM(CASE WHEN stage = \'M10\' THEN 1 ELSE 0 END) AS javascript_es6'),
            knex.raw('SUM(CASE WHEN stage = \'M11\' THEN 1 ELSE 0 END) AS call_back_and_async'),
            knex.raw('SUM(CASE WHEN stage = \'M12\' THEN 1 ELSE 0 END) AS html_and_css'),
            knex.raw('SUM(CASE WHEN stage = \'M13\' THEN 1 ELSE 0 END) AS crud'),
            knex.raw('SUM(CASE WHEN stage = \'M14\' THEN 1 ELSE 0 END) AS bootstrap_and_jquery'),
            knex.raw('SUM(CASE WHEN stage = \'M15\' THEN 1 ELSE 0 END) AS mysql_knex_joi'),
            knex.raw('SUM(CASE WHEN stage = \'M16\' THEN 1 ELSE 0 END) AS state_props_components'),
            knex.raw('SUM(CASE WHEN stage = \'M17\' THEN 1 ELSE 0 END) AS jwt'),
            knex.raw('SUM(CASE WHEN stage = \'M18\' THEN 1 ELSE 0 END) AS react_life_cycle'),
            knex.raw('SUM(CASE WHEN stage = \'M19\' THEN 1 ELSE 0 END) AS project1'),
            knex.raw('SUM(CASE WHEN stage = \'M20\' THEN 1 ELSE 0 END) AS project2'),
            knex.raw('SUM(CASE WHEN stage = \'M21\' THEN 1 ELSE 0 END) AS interview_preparations'),
            knex.raw('SUM(CASE WHEN stage = \'M22\' THEN 1 ELSE 0 END) AS job_search'),
            knex.raw('SUM(CASE WHEN stage = \'onLeave\' THEN 1 ELSE 0 END) AS on_leave'),
            knex.raw('SUM(CASE WHEN stage = \'droppedOut\' THEN 1 ELSE 0 END) AS dropped_out'),
            knex.raw('SUM(CASE WHEN stage = \'inJob\' THEN 1 ELSE 0 END) AS in_job'),
            knex.raw('SUM(CASE WHEN stage = \'payingForward\' THEN 1 ELSE 0 END) AS paying_forward'),
            knex.raw('SUM(CASE WHEN stage = \'paidForward\' THEN 1 ELSE 0 END) AS paid_forward'),

            knex.raw('SUM(CASE WHEN stage = \'testFailed\' THEN 1 ELSE 0 END) AS testfailed_count'),
            knex.raw('SUM(CASE WHEN stage = \'selected\' THEN 1 ELSE 0 END) AS selected_count'),
            knex.raw('SUM(CASE WHEN stage = \'electedButNotJoined\' THEN 1 ELSE 0 END) AS elected_but_not_joined_count'),
            knex.raw('SUM(CASE WHEN stage = \'notReachable\' THEN 1 ELSE 0 END) AS not_reachable_count'),
            knex.raw('SUM(CASE WHEN stage = \'disqualifiedAfterDiversityFilter\' THEN 1 ELSE 0 END) AS disqualified_after_diversity_filter_count'),
            knex.raw('SUM(CASE WHEN stage = \'diversityBasedDecisionPending\' THEN 1 ELSE 0 END) AS diversity_based_decision_pending_count'),
            knex.raw('SUM(CASE WHEN stage = \'possibleDuplicate\' THEN 1 ELSE 0 END) AS possible_duplicate_count'),
            knex.raw('SUM(CASE WHEN stage = \'caughtCheating\' THEN 1 ELSE 0 END) AS caught_cheating_count'),
            knex.raw('SUM(CASE WHEN stage = \'tuitionGroup\' THEN 1 ELSE 0 END) AS tuition_group_count'),
            knex.raw('SUM(CASE WHEN stage = \'requestCallback\' THEN 1 ELSE 0 END) AS request_callback_count'),
            knex.raw('SUM(CASE WHEN stage = \'queryResolvedAfterCallback\' THEN 1 ELSE 0 END) AS query_resolved_after_callback_count'),
            knex.raw('SUM(CASE WHEN stage = \'pendingCultureFitReinterview\' THEN 1 ELSE 0 END) AS pending_culture_fit_reinterview_count'),
          ])
          .where('partner_id', i.id)
          .toString();

        const result = await knex.raw(query);
        const rows = result.rows[0];

        const output = {
          partner_name: i.name,
          date: formattedDate,
          district: i.districts,
          total_students: rows.total_students,
          'Enrolment Key Generated': rows.enrolment_key_generated_count,
          'Created Student Without Exam': rows.created_student_without_exam_count,
          'Basic Details Entered': rows.basic_details_entered_count,
          'English Interview Pending (2nd Round)': rows.pending_english_interview_count,
          'English Interview Failed': rows.english_interview_fail_count,
          'Algebra Interview Pending (3rd Round)': rows.pending_algebra_interview_count,
          'Algebra Interview Failed': rows.algebra_interview_fail_count,
          'Culture Fit Interview Pending (4th Round)': rows.pending_culturefit_interview_count,
          'Culture Interview Failed': rows.culturefit_interview_fail_count,
          'Pending Parent Conversations': rows.pending_parent_conversation_count,
          'Parent Conversation Failed': rows.parent_conversation_fail_count,

          'Selected & Joining Awaited': rows.selected_and_joining_awaited_count,
          'Offer Letter Sent': rows.offer_letter_sent,
          'Deferred Joining': rows.deferred_joining_count,


          'Pending Travel Plans': rows.pending_travel_planning_count,
          'Finalized Travel Plans': rows.finalised_travel_plans_count,
          'Became Disinterested': rows.became_dis_intersested_count,
          'Joined': rows.finally_joined_count,
          'English & Quarantine': rows.english_quarantine_count,
          'Dry Run': rows.dry_run_count,

          'If - Else': rows.if_else_count,
          Loops: rows.loop_count,
          Lists: rows.lists,
          Functions: rows.functions,
          'Python Complete': rows.python_complete,
          'Hangman, Requests & more': rows.hangman_requests_more,
          'Web Scraping': rows.web_scraping,
          'Javascript / ES6': rows.javascript_es6,
          'NodeJS - Callbacks & Async': rows.call_back_and_async,
          'React - HTML & CSS': rows.html_and_css,
          CRUD: rows.crud,
          'Bootstrap & Jquery': rows.bootstrap_and_jquery,
          'MySQL/Knex/Joi': rows.mysql_knex_joi,
          'State, Props & Components': rows.state_props_components,
          JWT: rows.jwt,
          'React Lifecycle': rows.react_life_cycle,
          'Project 1': rows.project1,
          'Project 2': rows.project2,
          'Interview Preparation': rows.interview_preparations,
          'Job Search': rows.job_search,
          'On Leave': rows.on_leave,
          'Dropped Out': rows.dropped_out,
          'In Job': rows.in_job,
          'Paying Forward': rows.paying_forward,
          'Paid Forward': rows.paid_forward,

          'Test Failed': rows.testfailed_count,
          'Selected': rows.selected_count,
          'Selected But Not Joined': rows.elected_but_not_joined_count,
          'Unreachable': rows.not_reachable_count,
          'Diversity Failed': rows.paid_forward,
          'Decision Pending based on Diversity': rows.disqualified_after_diversity_filter_count,
          'Duplicate': rows.possible_duplicate_count,
          'Caught Cheating': rows.caught_cheating_count,
          'Tution Group': rows.tuition_group_count,
          'Requested Callback': rows.request_callback_count,
          'Query Resolved After CallBack': rows.query_resolved_after_callback_count,
          'Pending Culture Fit Re-Interview': rows.pending_culture_fit_reinterview_count

        };
        container.push(output)
      }
      return container;
    } catch (error) {
      console.error(error);
      throw error;
    }


  }


};
