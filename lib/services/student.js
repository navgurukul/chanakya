const Schmervice = require("schmervice");
const _ = require("underscore");
const moment = require("moment");
const CONSTANTS = require("../constants");

module.exports = class StudentService extends (
  Schmervice.Service
) {
  async findById(id, txn = null) {
    const { Student } = this.server.models();
    const student = await Student.query(txn)
      .throwIfNotFound()
      .findById(id)
      .eager("contacts");
    return student;
  }

  async findAllByPartner(partner_id, fromDate, toDate, txn = null) {
    const { Student } = this.server.models();
    const FromDate = fromDate;
    const ToDate = toDate;
    const eagerRelation = {
      contacts: true,
      enrolmentKey: true,
      lastTransition: true,
    };

    const students = await Student.query(txn)
      .skipUndefined()
      .eager(eagerRelation)
      .where("partner_id", partner_id)
      .andWhere("created_at", ">=", FromDate)
      .andWhere("created_at", "<=", ToDate);
    console.log(students);
    return students;

    // if (FromDate && !ToDate) {
    //   const students = await Student.query(txn)
    //     .eager(eagerRelation)
    //     .where("partner_id", partner_id)
    //     .andWhere("created_at", ">=", FromDate);
    //   return students;
    // }
    // if (!FromDate && ToDate) {
    //   const students = await Student.query(txn)
    //     .eager(eagerRelation)
    //     .where("partner_id", partner_id)
    //     .andWhere("created_at", "<=", ToDate);
    //   return students;
    // }
    // if (FromDate && ToDate) {
    //   const students = await Student.query(txn)
    //     .eager(eagerRelation)
    //     .where("partner_id", partner_id)
    //     .andWhere("created_at", ">=", FromDate)
    //     .andWhere("created_at", "<=", ToDate);
    //   return students;
    // }

    // .select('partner_assessments.name as setName', 'students.*')
    // .where({
    //   'students.partner_id': partner_id,
    // })
    // .innerJoin('enrolment_keys', 'enrolment_keys.student_id', 'students.id')
    // .innerJoin('partner_assessments', 'partner_assessments.question_set_id', 'enrolment_keys.question_set_id');

    return students;
  }

  async findEnrolmentKeyByKey(key, notIn = false) {
    const { EnrolmentKey } = this.server.models();
    const q = EnrolmentKey.query().eager({
      student: {
        partner: true,
        contacts: true,
        transitions: true,
      },
      questionSet: {
        testVersion: true,
      },
    });

    if (Array.isArray(key)) {
      if (notIn) {
        const result = await q.whereNotIn("key", key);
        return result;
      }
      const result = await q.whereIn("key", key);
      return result;
    }
    if (notIn) {
      const result = await q.whereNotIn("key", key);
      return result;
    }
    const result = await q.where({ key });
    return result;
  }

  async findIncomingCallById(id, notIn = false) {
    const { IncomingCall } = this.server.models();
    const q = IncomingCall.query().eager({
      contact: {
        student: {
          partner: true,
          transitions: true,
          contacts: true,
        },
      },
    });

    if (Array.isArray(id)) {
      if (notIn) {
        const result = await q.whereNotIn("id", id);
        return result;
      }
      const result = await q.whereIn("id", id);
      return result;
    }
    if (notIn) {
      const result = await q.whereNot("id", id);
      return result;
    }
    const result = await q.findById(id);
    return result;
  }

  async findAll(eagerExp = null, txn = null) {
    const { Student } = this.server.models();
    const result = await Student.query(txn).eager(eagerExp);
    return result;
  }

  async findAllByContact(mobile, txn = null) {
    const { Contact } = this.server.models();
    const contact = await Contact.query(txn).where({ mobile }).eager("student");
    return contact;
  }

  async findOneByContact(mobile, latest = true, txn = null) {
    /* if latest is true then does a descending sort otherwise an ascending one */
    const { Contact } = this.server.models();
    const sortType = latest ? "desc" : "asc";
    const results = await Contact.query(txn)
      .where({ mobile })
      .joinRelation("student")
      .orderBy("student.created_at", sortType)
      .limit(1)
      .eager("student");
    return results[0];
  }

  async findStudentsByStageTransition(
    to_stage,
    WhereClause = {},
    whereNotClause = {},
    txn = null
  ) {
    let whereClause = WhereClause;
    const { StageTransition } = this.server.models();
    whereClause = _.assign(whereClause, {
      "stage_transitions.to_stage": to_stage,
    });

    const q = StageTransition.query(txn)
      .joinRelation("student")
      .where(whereClause)
      .whereNot(whereNotClause);
    const transitions = await q;
    return transitions;
  }

  async addIncomingCall(call_type, contact, txn = null) {
    const { IncomingCall } = this.server.models();
    const incomingCall = await IncomingCall.query(txn).insert({
      contact_id: contact.id,
      call_type,
    });
    return incomingCall;
  }

  async create(stage, incomingCall = null, Details = {}, txn = null) {
    const { Student } = this.server.models();
    const details = Details;
    details.stage = stage;
    // pull out whatsapp & mobile keys
    const { whatsapp } = details;
    delete details.whatsapp;
    const { mobile } = details;
    delete details.mobile;

    if (!details.partner_id) {
      delete details.partner_id;
    }

    // add mobile & whatsapp as contacts
    details.contacts = [
      { mobile, is_whatsapp: false, contact_type: "primary" },
    ];
    if (whatsapp) {
      details.contacts.push({
        mobile: whatsapp,
        is_whatsapp: true,
        contact_type: "whatsapp",
      });
    }

    // if incoming call is specified create it on the first contact
    // TODO: this might be shitty logic need to change it sometime
    if (incomingCall != null) {
      details.contacts[0].incomingCalls = [{ call_type: incomingCall }];
    }

    // add a transition
    details.transitions = [{ to_stage: stage }];
    const studentDetails = await Student.query(txn).insertGraph(details);
    return studentDetails;
  }

  async sendEnrolmentKey(Options) {
    const options = Options;
    const partner_id = options.partner_id ? options.partner_id : null;
    /* if mobile is present in options then creates a new student
           otherwise sends the enrolment key to an existing one */
    if (options.studentOrId && options.mobile) {
      throw new Error("Both studentOrId and mobile cannot be present.");
    }
    if (options.fromHelpline == null) {
      options.fromHelpline = false;
    }

    const { EnrolmentKey, Partner } = this.server.models();
    const { exotelService } = this.server.services();

    if (partner_id) {
      const partner = await Partner.query().where("id", partner_id);
      if (partner.length === 0) {
        throw new Error("Partner Id is not valid");
      }
    }

    let student;
    let key;
    if (options.mobile) {
      student = await this.create(
        "enrolmentKeyGenerated",
        options.fromHelpline ? "getEnrolmentKey" : null,
        { mobile: options.mobile, partner_id: partner_id }
      );
      key = await EnrolmentKey.generateNewKey(student.id);
      await exotelService.sendSMS(options.mobile, "enrolmentKeyGenerated", key); // smsResponse
    }

    return key;
  }

  hasStudentStageChanged(student, currentStageOnSheet) {
    return student.stage !== currentStageOnSheet;
  }

  isStageValid(currentStageOnSheet) {
    return CONSTANTS.studentStages.includes(currentStageOnSheet) === true;
  }

  shouldRecordStudentTranisition(student, currentStageOnSheet) {
    // if any stage would be added in the sheet in the future.
    if (!currentStageOnSheet) {
      return {
        errorMessage: null,
        shouldRecord: false,
      };
    }
    if (!this.isStageValid(currentStageOnSheet)) {
      return {
        errorMessage: `Can't recognize the stage ${currentStageOnSheet}`,
        shouldRecord: false,
      };
    }

    // update student stage with the stage on the gSheet & create a stage transition record.
    if (this.hasStudentStageChanged(student, currentStageOnSheet)) {
      return {
        errorMessage: null,
        shouldRecord: true,
      };
    }
    return {
      errorMessage: null,
      shouldRecord: false,
    };
  }

  hasPartnerNameChangedOnSheet(partners, student, partnerNameOnSheet) {
    if (!partnerNameOnSheet) {
      return {
        errorMessage: null,
        partner_id: null,
      };
    }

    const partner = partners[partnerNameOnSheet];

    if (partner) {
      if (partner.id !== student.partner_id) {
        return {
          errorMessage: null,
          partner_id: partner.id,
        };
      }
      return {
        errorMessage: null,
        partner_id: null,
      };
    }
    return {
      partner_id: null,
      errorMessage: `Can't recognized partner name ${partnerNameOnSheet}`,
    };

    // when partner name is in DB but not in gSheet.
  }

  studentStageNotChangeSince(student) {
    if (student.transitions.length > 0) {
      const lastStageChangeAt = _.max(
        _.map(student.transitions, (transitions) => transitions.created_at)
      );
      const currentDate = moment(new Date());
      return currentDate.diff(moment(lastStageChangeAt), "days");
    }
    return null;
  }

  swapEnumKeysWithValues(Details) {
    const details = Details;
    // some fields are ints on model but string on API for more usability
    // do the required massaging as per the model using mappings in constants
    const specialFields = [
      "gender",
      "qualification",
      "currentStatus",
      "caste",
      "religon",
      "school_medium",
    ];
    _.each(specialFields, (field) => {
      if (details[field]) {
        details[field] = CONSTANTS.studentDetails[field][details[field]];
      } else {
        details.current_status =
          CONSTANTS.studentDetails[field][details.current_status];
      }
    });
    return details;
  }

  async studentStatus(mobileNumber, txn = null) {
    const mobile = mobileNumber;
    const { Contact } = this.server.models();

    const contact = await Contact.query(txn)
      .where({ mobile })
      .eager({
        student: {
          transitions: true,
          enrolmentKey: true,
        },
      });
    const studentDetails = [];
    _.each(contact, (studentInfo) => {
      const { student } = studentInfo;
      const { transitions, enrolmentKey } = student;
      const [EnrolmentKey] = enrolmentKey;
      const studentStatus = {};
      const updatedStage = transitions[transitions.length - 1];
      if (updatedStage.to_stage !== "requestCallback") {
        studentStatus.name = student.name;
        studentStatus.city = student.city;
        studentStatus.state = CONSTANTS.studentDetails.states[student.state];
        studentStatus.gender = _.invert(CONSTANTS.studentDetails.gender)[
          student.gender
        ];
        studentStatus.transitions = transitions;
        studentStatus.to_stage = updatedStage.to_stage;
        studentStatus.from_stage = updatedStage.from_stage;
        studentStatus.marks = EnrolmentKey ? EnrolmentKey.total_marks : null;
        studentStatus.linkForEnglishTest =
          updatedStage.to_stage === "pendingEnglishInterview" ? null : null;
        studentStatus.linkForOnlineTest =
          updatedStage.to_stage === "enrolmentKeyGenerated"
            ? `http://join.navgurukul.org/k/${EnrolmentKey.key}`
            : null;
        studentDetails.push(studentStatus);
      }
    });
    return studentDetails;
  }

  requestCallback(RqcData) {
    const rqcData = RqcData;
    const array = [];
    _.each(rqcData, (studentData) => {
      const studentDetails = studentData;
      studentDetails.SetName = null;
      delete studentDetails.partnerAssessment;
      array.push(studentDetails);
    });
    return array;
  }

  softwareCourse(courseData) {
    const CourseData = courseData;
    const array = [];
    _.each(CourseData, (studentData) => {
      const studentDetails = studentData;
      if (studentDetails.partnerAssessment !== null) {
        studentDetails.SetName = studentDetails.partnerAssessment.name;
        delete studentDetails.partnerAssessment;
      } else {
        studentDetails.SetName = null;
        delete studentDetails.partnerAssessment;
      }
      if (studentDetails.feedbacks) {
        studentDetails.deadline = studentDetails.feedbacks.deadline_at;
        studentDetails.to_assign = studentDetails.feedbacks.to_assign;
        studentDetails.status = studentDetails.feedbacks.state;
        delete studentDetails.feedbacks;
      } else {
        studentDetails.deadline = null;
        studentDetails.to_assign = null;
        studentDetails.status = null;
        delete studentDetails.feedbacks;
      }
      if (studentDetails.partner) {
        studentDetails.partnerName = studentDetails.partner.name;
      } else {
        studentDetails.partnerName = null;
      }
      array.push(studentDetails);
    });
    return array;
  }

  async getStudentDetalisByStage(courseData) {
    const CourseData = courseData;
    const array = [];
    _.each(CourseData, (studentData) => {
      const studentDetails = studentData;
      if (studentDetails.partnerAssessment !== null) {
        studentDetails.SetName = studentDetails.partnerAssessment.name;
        delete studentDetails.partnerAssessment;
      } else {
        studentDetails.SetName = null;
        delete studentDetails.partnerAssessment;
      }
      if (studentDetails.partner) {
        studentDetails.partnerName = studentDetails.partner.name;
      } else {
        studentDetails.partnerName = null;
      }
      array.push(studentDetails);
    });
    return array;
  }

  async studentsDataForDashBoard(
    typeOfData,
    fromDate,
    toDate,
    stage,
    txn = null
  ) {
    const FromDate = fromDate;
    const ToDate = toDate;
    const Stage = stage;
    const studentTypeOfData = typeOfData;
    const { Student } = this.server.models();
    const eagerRelation = {
      partner: true,
      contacts: true,
      enrolmentKey: true,
      partnerAssessment: true,
      lastTransition: true,
      feedbacks: true,
    };

    if (Stage) {
      if (FromDate && ToDate) {
        const courseData = await Student.query(txn)
          .where("stage", Stage)
          .andWhere("created_at", ">=", FromDate)
          .andWhere("created_at", "<=", ToDate)
          .eager(eagerRelation);
        const array = await this.getStudentDetalisByStage(courseData);
        return array;
      }
      if (FromDate && !ToDate) {
        const courseData = await Student.query(txn)
          .where("stage", Stage)
          .andWhere("created_at", ">=", FromDate)
          .eager(eagerRelation);
        const array = await this.getStudentDetalisByStage(courseData);
        return array;
      }
      if (!FromDate && !ToDate) {
        const courseData = await Student.query(txn)
          .where("stage", Stage)
          .eager(eagerRelation);
        const array = await this.getStudentDetalisByStage(courseData);
        return array;
      }
    }

    if (studentTypeOfData === "requestCallback") {
      if (FromDate && ToDate) {
        const rqcData = await Student.query(txn)
          .where("stage", studentTypeOfData)
          .andWhere("created_at", ">=", FromDate)
          .andWhere("created_at", "<=", ToDate)
          .eager(eagerRelation);
        const array = await this.requestCallback(rqcData);
        return array;
      }
      if (FromDate && !ToDate) {
        const rqcData = await Student.query(txn)
          .where("stage", studentTypeOfData)
          .andWhere("created_at", ">=", FromDate)
          .eager(eagerRelation);
        const array = await this.requestCallback(rqcData);
        return array;
      }
      if (!FromDate && !ToDate) {
        const rqcData = await Student.query(txn)
          .where("stage", studentTypeOfData)
          .eager(eagerRelation);
        const array = await this.requestCallback(rqcData);
        return array;
      }
    } else {
      if (FromDate && ToDate) {
        const courseData = await Student.query(txn)
          .whereNot("stage", "requestCallback")
          .whereNot("stage", "enrolmentKeyGenerated")
          .whereNot("stage", "basicDetailsEntered")
          .whereNot("stage", "testFailed")
          .andWhere("created_at", ">=", FromDate)
          .andWhere("created_at", "<=", ToDate)
          .eager(eagerRelation);
        const array = await this.softwareCourse(courseData);
        return array;
      }
      if (FromDate && !ToDate) {
        const courseData = await Student.query(txn)
          .whereNot("stage", "requestCallback")
          .whereNot("stage", "enrolmentKeyGenerated")
          .whereNot("stage", "basicDetailsEntered")
          .whereNot("stage", "testFailed")
          .andWhere("created_at", ">=", FromDate)
          .eager(eagerRelation);
        const array = await this.softwareCourse(courseData);
        return array;
      }
      if (!FromDate && !ToDate) {
        const courseData = await Student.query(txn)
          .whereNot("stage", "requestCallback")
          .whereNot("stage", "enrolmentKeyGenerated")
          .whereNot("stage", "basicDetailsEntered")
          .whereNot("stage", "testFailed")
          .eager(eagerRelation);
        const array = await this.softwareCourse(courseData);
        return array;
      }
    }
    return null;
  }

  async getStudentById(id, txn = null) {
    const studentId = id;
    const { Student } = this.server.models();
    const student = await Student.query(txn).where("id", studentId).eager({
      partner: true,
      contacts: true,
      enrolmentKey: true,
      partnerAssessment: true,
      lastTransition: true,
      feedbacks: true,
    });
    return student;
  }

  async getTransitionData(student_id, txn = null) {
    const { StageTransition } = this.server.models();
    const transitions = await StageTransition.query(txn)
      .eager({
        feedbacks: true,
      })
      .where("student_id", student_id);
    return transitions;
  }

  async stageWiseGenderDistribution(txn = null) {
    const { Student } = this.server.models();
    const allStudents = await Student.query(txn)
      .select("students.stage", "students.gender")
      .orderBy("id", "desc")
      .limit(5000);

    const allReport = {};

    _.each(allStudents, (student) => {
      if (!allReport[student.stage]) {
        allReport[student.stage] = {
          1: 0,
          2: 0,
          3: 0,
          null: 0,
        };
      }
      allReport[student.stage][student.gender] += 1;
    });

    return allReport;
  }

  async stageWiseDanglingReport(txn = null) {
    const { Student } = this.server.models();

    const danglingReport = {};

    const danglingRecord = await Student.query(txn)
      .eager({
        danglingtranstions: true,
      })
      .orderBy("id", "desc")
      .limit(5000);

    _.each(danglingRecord, (details) => {
      const [stageTransition] = details.danglingtranstions;
      if (stageTransition) {
        if (CONSTANTS.feedbackableStages.indexOf(details.stage) > -1) {
          const diffTime = Math.abs(
            new Date() - new Date(stageTransition.created_at)
          );
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 3) {
            if (!danglingReport[details.stage]) {
              danglingReport[details.stage] = {
                1: 0,
                2: 0,
                3: 0,
                null: 0,
              };
            }

            danglingReport[details.stage][details.gender] += 1;
          }
        }
      }
    });

    return danglingReport;
  }

  async calculatePercentile(students, obtainMark) {
    const Students = students;
    const ObtainMark = obtainMark;
    const marksInDecendingOrder = [];
    let percentile = 0;
    _.each(Students, (student) => {
      marksInDecendingOrder.push(parseInt(student.enrolmentKey[0].total_marks));
    });

    marksInDecendingOrder.sort((a, b) => b - a);
    if (
      marksInDecendingOrder.findIndex(
        (marks) => parseInt(marks) < parseInt(ObtainMark)
      ) >= 0
    ) {
      const totalStudentsBelowMarks =
        marksInDecendingOrder.length -
        (marksInDecendingOrder.findIndex(
          (marks) => parseInt(marks) < parseInt(ObtainMark)
        ) +
          1);
      const totalStudents = marksInDecendingOrder.length;
      percentile = (totalStudentsBelowMarks / totalStudents) * 100;
      return percentile;
    }
    return percentile;
  }

  async getStudentsPercentile(key, details, txn = null) {
    const Key = key;
    const { state } = details;
    const { Student, EnrolmentKey } = this.server.models();
    const [studentMark] = await EnrolmentKey.query(txn).where("key", Key);
    const obtainMark = studentMark.total_marks;

    const nationalWiseStudents = await Student.query(txn)
      .orderBy("id", "desc")
      .limit(1000)
      .whereNot("stage", "enrolmentKeyGenerated")
      .whereNot("stage", "requestCallback")
      .whereNot("stage", "basicDetailsEntered")
      .eager({
        enrolmentKey: true,
      });
    const percentileNationalwise = await this.calculatePercentile(
      nationalWiseStudents,
      obtainMark
    );

    const stateWiseStudents = await Student.query(txn)
      .orderBy("id", "desc")
      .limit(1000)
      .where("state", state)
      .eager({
        enrolmentKey: true,
      });
    const percentileStatewise = await this.calculatePercentile(
      stateWiseStudents,
      obtainMark
    );
    return {
      percentileNationalwise,
      percentileStatewise,
    };
  }

  async addTagForOnlineClasses(id, tag) {
    const { Student } = this.server.models();
    const addTag = await Student.query()
      .patch({
        tag: tag,
      })
      .where("id", id);

    return addTag;
  }

  async addAndUpdateContact(details, student_id, txn = null) {
    // Add or Update contact Number.
    const { Contact } = this.server.models();
    const addOrUpdate = details.updateOrAddType;
    delete details.updateOrAddType;

    if (addOrUpdate == "addContact") {
      details.student_id = student_id;
      details.is_whatsapp = false;
      const addContact = await Contact.query(txn).insert(details);
      return addContact;
    }
    const updateContact = await Contact.query(txn)
      .patch(details)
      .where("student_id", student_id)
      .where("contact_type", details.contact_type);
    return updateContact;
  }

  async informToCompleteTheTest() {
    // Inform complete the test to students.
    const { feedbackService } = this.server.services();
    const sendSMS = await feedbackService.getSMSPromises(
      -(CONSTANTS.informToCompleteTheTest.afterBasicDetailsEntered + 1),
      "informToCompleteTheTest"
    );
    return sendSMS;
  }

  async getContacts(student_id) {
    // getting student contact for extra details to showing on dashboard.
    const { Contact } = this.server.models();
    const contacts = await Contact.query().where("student_id", student_id);
    return contacts;
  }
};
