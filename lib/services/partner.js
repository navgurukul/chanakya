const Schmervice = require("schmervice");
const Papa = require("papaparse");
const axios = require("axios");
const Joi = require("joi");
const Boom = require("boom");
const _ = require("underscore");

const Student = require("../models/student");
const Contact = require("../models/studentContact");
const CONSTANTS = require("../constants");
const { createTestAndAnswerKeyPDF } = require("../helpers/pdfGenerator");
const { val } = require("objection");

const internals = {};
internals.csvRowAttrsSchema = Joi.object({
  name: Student.field("name"),
  gender: Joi.string()
    .valid(..._.keys(CONSTANTS.studentDetails.gender))
    .lowercase()
    .required(),
  dob: Student.field("dob").allow(null),
  whatsapp: Contact.field("mobile").allow(null),
  mobile: Contact.field("mobile"),
  email: Student.field("email").allow(null),
  state: Joi.string()
    .valid(..._.values(CONSTANTS.studentDetails.states))
    .required(),
  city: Student.field("city").allow(null),
  pin_code: Student.field("pin_code").allow(null),
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

  percentage_in10th: Joi.alternatives().when("qualification", {
    is: "lessThan10th",
    then: Joi.string().allow(null),
    otherwise: Joi.string().required(),
  }),

  math_marks_in10th: Joi.alternatives().when("qualification", {
    is: "lessThan10th",
    then: Joi.string().allow(null),
    otherwise: Joi.string().required(),
  }),

  percentage_in12th: Joi.alternatives()
    .when("qualification", {
      is: "class12th",
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    })
    .when("qualification", {
      is: "graduate",
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),

  math_marks_in12th: Joi.alternatives()
    .when("qualification", {
      is: "class12th",
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    })
    .when("qualification", {
      is: "graduate",
      then: Joi.string().required(),
      otherwise: Joi.string().allow(null),
    }),
});
internals.stateOppMapping = _.object(
  _.map(_.pairs(CONSTANTS.studentDetails.states), (s) => [s[1], s[0]])
);
internals.csvRequiredHeaders = [
  "name",
  "gender",
  "dob",
  "mobile",
  "whatsapp",
  "email",
  "state",
  "city",
  "qualification",
  "current_status",
  "caste",
  "religon",
  "pin_code",
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
    const result = await query;
    return result;
  }

  async findBySlug(slug, txn = null) {
    const { Partner } = this.server.models();
    const query = Partner.query(txn).throwIfNotFound().where("slug", slug);
    return query;
  }

  async findByEnrolmentKey(enrolmentKey) {
    const { EnrolmentKey } = this.server.models();
    const query = await EnrolmentKey.query()
      .throwIfNotFound()
      .where("key", enrolmentKey)
      .withGraphFetched("partner");
    if (Object.keys(query[0].partner).length > 0) {
      return query[0].partner;
    }
    throw Boom.notFound("Partner not found for the student");
  }

  async findByStudentId(studentId) {
    const { Student } = this.server.models();
    const query = await Student.query()
      .throwIfNotFound()
      .where("id", studentId)
      .withGraphFetched("partner");
    return query[0].partner;
  }

  async findByName(name, eagerExpr = null, txn = null) {
    const { Partner } = this.server.models();
    let query = Partner.query(txn).where("name", name);
    if (eagerExpr) {
      query = query.eager(eagerExpr);
    }
    const result = await query;
    return result;
  }

  async findPartnerById(id, notIn = false) {
    const { Partner } = this.server.models();
    const q = Partner.query();
    if (Array.isArray(id)) {
      if (notIn) {
        const result = await q.whereNotIn("id", id);
        return result;
      }
      const result = await q.whereIn("id", id);
      return result;
    }
    if (notIn) {
      const result = await q.whereNotIn("id", id);
      return result;
    }
    const result = await q.where({ id });
    return result;
  }

  async findAll(txn) {
    const { Partner } = this.server.models();
    const partner = await Partner.query(txn);
    return partner;
  }

  async update(id, details, txn = null) {
    const { Partner } = this.server.models();
    const updatePartner = await Partner.query(txn)
      .update(details)
      .where({ id });
    return updatePartner;
  }

  async create(details, txn = null) {
    const { Partner } = this.server.models();

    const validateSlug = /^[a-z0-9-]+$/;
    if (!validateSlug.test(details.slug)) {
      throw Boom.conflict(
        "Invalide slug, set slug as minimum small letter character and number"
      );
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
      districts: val(districts).asArray().castTo("text[]"),
    };
    await Partner.query(txn).insert(withDistricts);
    const insertedData = await Partner.query().where({ slug: details.slug });
    return await this.meraki_link(insertedData[0].id);
  }

  async createAssessment(partner, assessmentName, txn = null) {
    const { PartnerAssessment } = this.server.models();
    const { assessmentService } = this.server.services();

    const { questions, questionSet } =
      await assessmentService.createQuestionSetForPartner();
    const { questionPaperUrl, answer_key_url } =
      await createTestAndAnswerKeyPDF(questions, partner.name, assessmentName);
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

    response.missingHeaders = _.filter(
      internals.csvRequiredHeaders,
      (columnName) => {
        if (headers.indexOf(columnName) > -1) {
          return false;
        }
        return true;
      }
    );

    // return and don't proceed to parsing every row if the required headers are not present
    if (response.missingHeaders.length > 0) {
      response.csvParsingError = true;
      return response;
    }

    // Joi schema for the question answers specified in the CSV
    // This is dynamic as it will depend on the questions of the question set
    const questionAnswersSchema = _.object(
      _.map(questionSet.questions, (question, index) => {
        if (question.type === CONSTANTS.questions.types.integer) {
          return [String(index + 1), Joi.number().allow(null)];
        }
        const optionsRange = [
          ...internals.generateCharRangeFromAscii(65, question.options.length),
          ...internals.generateCharRangeFromAscii(97, question.options.length),
        ];
        return [
          String(index + 1),
          Joi.string().valid(optionsRange).allow(null),
        ];
      })
    );

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
      const studentDetails = Joi.validate(row, internals.csvRowAttrsSchema, {
        stripUnknown: true,
        abortEarly: false,
      });
      if (!studentDetails.error) {
        obj.data.details = studentDetails.value;
      } else {
        response.csvParsingError = true;
        obj.detailErrors = _.map(
          studentDetails.error.details,
          (err) => err.message
        );
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

    const csvResults = await this.parseCSV(csvUrl);
    // throw a boom error in case there is any error
    if (csvResults.errors.length > 0) {
      return csvResults.errors;
    }

    // get the questions of the attached questions in the right order
    const partnerAssessment = await PartnerAssessment.query(txn)
      .findById(assessmentId)
      .eager("partner");
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
        student.data.details.state =
          internals.stateOppMapping[student.data.details.state];
      }
      return assessmentService.recordOfflineStudentAnswers(
        student.data.details,
        student.data.answers,
        questionSet
      );
    });
    return Promise.all(promises);
  }

  async progressMade(partner_id) {
    const { Student } = this.server.models();

    const convertedData = {
      "Selected for Navgurukul One-year Fellowship": {
        selectedAndJoiningAwaited: [],
        offerLetterSent: [],
        pendingTravelPlanning: [],
        finalisedTravelPlans: [],
        finalisedTravelPlansBangalore: [],
        finalisedTravelPlansDharamshala: [],
        finalisedTravelPlansPune: [],
        finalisedTravelPlansSarjapura: [],
        finallyJoined: [],
        finallyJoinedDharamshala: [],
        finallyJoinedPune: [],
        finallyJoinedBangalore: [],
        finallyJoinedSarjapura: [],
        deferredJoining: [],
      },
      "Need Action": {
        pendingAlgebraInterview: [],
        pendingEnglishInterview: [],
        pendingCultureFitInterview: [],
        pendingParentConversation: [],
      },
      "Need Your Help": {
        becameDisIntersested: [],
        notReachable: [],
      },
      "Failed Students": {
        testFailed: [],
        englishInterviewFail: [],
        algebraInterviewFail: [],
        tuitionGroup: [],
      },
    };

    const students = await Student.query()
      .eager({ contacts: true })
      .where("partner_id", partner_id)
      .orderBy("created_at", "desc")
      .withGraphFetched("feedbacks");

    _.each(students, (student) => {
      const { stage } = student;
      const data = {};

      data.name = student.name;
      data.mobile =
        student.contacts.length > 0 ? student.contacts[0].mobile : null;
      data.stage = student.stage;
      data.status = student.feedbacks ? student.feedbacks.state : null;
      if (
        stage === "finallyJoined" ||
        stage === "finalisedTravelPlans" ||
        stage === "finalisedTravelPlansBangalore" ||
        stage === "finalisedTravelPlansDharamshala" ||
        stage === "finalisedTravelPlansPune" ||
        stage === "finalisedTravelPlansSarjapura" ||
        stage === "pendingTravelPlanning" ||
        stage === "deferredJoining" ||
        stage === "selectedAndJoiningAwaited" ||
        stage === "offerLetterSent" ||
        stage === "finallyJoinedDharamshala" ||
        stage === "finallyJoinedBangalore" ||
        stage === "finallyJoinedPune" ||
        stage === "finallyJoinedSarjapura"
      ) {
        convertedData["Selected for Navgurukul One-year Fellowship"][
          stage
        ].push(data);
      }
      if (
        stage == "pendingAlgebraInterview" ||
        stage == "pendingCultureFitInterview" ||
        stage == "pendingEnglishInterview" ||
        stage == "pendingParentConversation"
      ) {
        convertedData["Need Action"][stage].push(data);
      }
      if (stage == "becameDisIntersested" || stage == "notReachable") {
        convertedData["Need Your Help"][stage].push(data);
      }
      if (
        stage == "testFailed" ||
        stage == "englishInterviewFail" ||
        stage == "algebraInterviewFail" ||
        stage == "tuitionGroup"
      ) {
        convertedData["Failed Students"][stage].push(data);
      }
    });

    return convertedData;
  }
  async partnerSpecificLink(platform, partner_id) {
    const { Partner } = this.server.models();
    let merakiLink;
    if (platform === "web") {
      merakiLink = `${CONSTANTS.web_link_url}${partner_id}`;
    } else if (platform === "android") {
      merakiLink = `${CONSTANTS.meraki_link_url}${partner_id}`;
    }
    let merakiShortLink;
    try {
      merakiShortLink = await axios.post(
        "https://api-ssl.bitly.com/v4/shorten",
        {
          long_url: merakiLink,
          domain: "bit.ly",
        },
        {
          headers: {
            Authorization: `Bearer ${CONSTANTS.bitly.token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      return { error: true, message: "Something went wrong." };
    }
    if (platform === "web") {
      return Partner.query()
        .throwIfNotFound()
        .patchAndFetchById(partner_id, { web_link: merakiShortLink.data.link });
    }
    return Partner.query().throwIfNotFound().patchAndFetchById(partner_id, {
      meraki_link: merakiShortLink.data.link,
    });
  }
  async student_progressMade(partner_id) {
    const { Student, Donor } = this.server.models();
    const { feedbackService, studentService } = this.server.services();
    let students = await Student.query()
      .eager({
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
      .where("partner_id", partner_id)
      .orderBy("created_at", "desc");
    students = students.filter((student) => student.campus.length > 0);
    students = await studentService.addStudentDetails(students);
    return students;
  }
};
