
const Schmervice = require('schmervice');
const _ = require('underscore');
const moment = require('moment');
const CONSTANTS = require('../constants');

module.exports = class StudentService extends Schmervice.Service {
  async findById(id, txn = null) {
    const { Student } = this.server.models();
    const student = await Student.query(txn).throwIfNotFound().findById(id).eager('contacts');
    return student;
  }

  async findAllByPartner(partnerId, txn = null) {
    const { Student } = this.server.models();

    const students = Student.query(txn).eager({
      contacts: true,
      enrolmentKey: true,
      lastTransition: true,
    })
      .select('partner_assessments.name as setName', 'students.*')
      .where({
        'students.partnerId': partnerId,
      })
      .innerJoin('enrolment_keys', 'enrolment_keys.studentId', 'students.id')
      .innerJoin('partner_assessments', 'partner_assessments.questionSetId', 'enrolment_keys.questionSetId');

    console.log(students.toString());


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
        const result = await q.whereNotIn('key', key);
        return result;
      }
      const result = await q.whereIn('key', key);
      return result;
    }
    if (notIn) {
      const result = await q.whereNotIn('key', key);
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
        const result = await q.whereNotIn('id', id);
        return result;
      }
      const result = await q.whereIn('id', id);
      return result;
    }
    if (notIn) {
      const result = await q.whereNot('id', id);
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
    const contact = await Contact.query(txn).where({ mobile }).eager('student');
    return contact;
  }

  async findOneByContact(mobile, latest = true, txn = null) {
    /* if latest is true then does a descending sort otherwise an ascending one */
    const { Contact } = this.server.models();
    const sortType = latest ? 'desc' : 'asc';
    const results = await Contact.query(txn).where({ mobile }).joinRelation('student')
      .orderBy('student.createdAt', sortType)
      .limit(1)
      .eager('student');
    return results[0];
  }

  async findStudentsByStageTransition(toStage, WhereClause = {}, whereNotClause = {}, txn = null) {
    let whereClause = WhereClause;
    const { StageTransition } = this.server.models();
    whereClause = _.assign(whereClause, {
      'stage_transitions.toStage': toStage,
    });

    const q = StageTransition.query(txn).joinRelation('student')
      .where(whereClause).whereNot(whereNotClause);
    const transitions = await q;
    return transitions;
  }

  async addIncomingCall(callType, contact, txn = null) {
    const { IncomingCall } = this.server.models();
    const incomingCall = await IncomingCall.query(txn).insert({
      contactId: contact.id,
      callType,
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

    // add mobile & whatsapp as contacts
    details.contacts = [
      { mobile, isWhatsapp: false },
    ];
    if (whatsapp) {
      details.contacts.push({
        mobile: whatsapp,
        isWhatsapp: true,
      });
    }

    // if incoming call is specified create it on the first contact
    // TODO: this might be shitty logic need to change it sometime
    if (incomingCall != null) {
      details.contacts[0].incomingCalls = [
        { callType: incomingCall },
      ];
    }

    // add a transition
    details.transitions = [{ toStage: stage }];
    const studentDetails = await Student.query(txn).insertGraph(details);
    return studentDetails;
  }

  async sendEnrolmentKey(Options) {
    const options = Options;
    /* if mobile is present in options then creates a new student
           otherwise sends the enrolment key to an existing one */
    if (options.studentOrId && options.mobile) {
      throw new Error('Both studentOrId and mobile cannot be present.');
    }
    if (options.fromHelpline == null) {
      options.fromHelpline = false;
    }

    const { EnrolmentKey } = this.server.models();
    const { exotelService } = this.server.services();

    let student; let key;
    if (options.mobile) {
      student = await this.create('enrolmentKeyGenerated', options.fromHelpline ? 'getEnrolmentKey' : null, { mobile: options.mobile });
      key = await EnrolmentKey.generateNewKey(student.id);
      await exotelService.sendSMS(options.mobile, 'enrolmentKeyGenerated', key); // smsResponse
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
        partnerId: null,
      };
    }

    const partner = partners[partnerNameOnSheet];

    if (partner) {
      if (partner.id !== student.partnerId) {
        return {
          errorMessage: null,
          partnerId: partner.id,
        };
      }
      return {
        errorMessage: null,
        partnerId: null,
      };
    }
    return {
      partnerId: null,
      errorMessage: `Can't recognized partner name ${partnerNameOnSheet}`,
    };

    // when partner name is in DB but not in gSheet.
  }

  studentStageNotChangeSince(student) {
    if (student.transitions.length > 0) {
      const lastStageChangeAt = _.max(_.map(student.transitions,
        (transitions) => transitions.createdAt));
      const currentDate = moment(new Date());
      return currentDate.diff(moment(lastStageChangeAt), 'days');
    }
    return null;
  }

  swapEnumKeysWithValues(Details) {
    const details = Details;
    // some fields are ints on model but string on API for more usability
    // do the required massaging as per the model using mappings in constants
    const specialFields = ['gender', 'qualification', 'currentStatus', 'caste', 'religon', 'schoolMedium'];
    _.each(specialFields, (field) => {
      if (details[field]) {
        details[field] = CONSTANTS.studentDetails[field][details[field]];
      }
    });
    return details;
  }

  async studentStatus(mobileNumber, txn = null) {
    const mobile = mobileNumber;
    const { Contact } = this.server.models();

    const contact = await Contact.query(txn).where({ mobile }).eager({
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
      if (updatedStage.toStage !== 'requestCallback') {
        studentStatus.name = student.name;
        studentStatus.city = student.city;
        studentStatus.state = CONSTANTS.studentDetails.states[student.state];
        studentStatus.gender = _.invert(CONSTANTS.studentDetails.gender)[student.gender];
        studentStatus.transitions = transitions;
        studentStatus.toStage = updatedStage.toStage;
        studentStatus.fromStage = updatedStage.fromStage;
        studentStatus.marks = EnrolmentKey.totalMarks ? EnrolmentKey.totalMarks : null;
        studentStatus.linkForEnglishTest = updatedStage.toStage === 'pendingEnglishInterview'
          ? 'test Link' : null;
        studentStatus.linkForOnlineTest = updatedStage.toStage === 'enrolmentKeyGenerated'
          ? `http://join.navgurukul.org/k/${EnrolmentKey.key}` : null;
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
      array.push(studentDetails);
    });
    return array;
  }

  async studentsDataForDashBoard(typeOfData, fromDate, toDate, stage, txn = null) {
    const FromDate = fromDate; const ToDate = toDate; const Stage = stage;
    const studentTypeOfData = typeOfData;
    const { Student } = this.server.models();
    const eagerRelation = {
      partner: true,
      contacts: true,
      enrolmentKey: true,
      partnerAssessment: true,
      lastTransition: true,
    };

    if (Stage) {
      if (FromDate && ToDate) {
        const courseData = await Student.query(txn)
          .where('stage', Stage)
          .andWhere('createdAt', '>=', FromDate)
          .andWhere('createdAt', '<=', ToDate)
          .eager(eagerRelation);
        const array = await this.getStudentDetalisByStage(courseData);
        return array;
      }
      if (FromDate && !ToDate) {
        const courseData = await Student.query(txn)
          .where('stage', Stage)
          .andWhere('createdAt', '>=', FromDate)
          .eager(eagerRelation);
        const array = await this.getStudentDetalisByStage(courseData);
        return array;
      }
      if (!FromDate && !ToDate) {
        const courseData = await Student.query(txn).where('stage', Stage)
          .eager(eagerRelation);
        const array = await this.getStudentDetalisByStage(courseData);
        return array;
      }
    }

    if (studentTypeOfData === 'requestCallback') {
      if (FromDate && ToDate) {
        const rqcData = await Student.query(txn)
          .where('stage', studentTypeOfData)
          .andWhere('createdAt', '>=', FromDate)
          .andWhere('createdAt', '<=', ToDate)
          .eager(eagerRelation);
        const array = await this.requestCallback(rqcData);
        return array;
      }
      if (FromDate && !ToDate) {
        const rqcData = await Student.query(txn)
          .where('stage', studentTypeOfData)
          .andWhere('createdAt', '>=', FromDate)
          .eager(eagerRelation);
        const array = await this.requestCallback(rqcData);
        return array;
      }
      if (!FromDate && !ToDate) {
        const rqcData = await Student.query(txn).where('stage', studentTypeOfData)
          .eager(eagerRelation);
        const array = await this.requestCallback(rqcData);
        return array;
      }
    } else {
      if (FromDate && ToDate) {
        const courseData = await Student.query(txn)
          .whereNot('stage', 'requestCallback')
          .andWhere('createdAt', '>=', FromDate)
          .andWhere('createdAt', '<=', ToDate)
          .eager(eagerRelation);
        const array = await this.softwareCourse(courseData);
        return array;
      }
      if (FromDate && !ToDate) {
        const courseData = await Student.query(txn)
          .whereNot('stage', 'requestCallback')
          .andWhere('createdAt', '>=', FromDate)
          .eager(eagerRelation);
        const array = await this.softwareCourse(courseData);
        return array;
      }
      if (!FromDate && !ToDate) {
        const courseData = await Student.query(txn).whereNot('stage', 'requestCallback')
          .eager(eagerRelation);
        const array = await this.softwareCourse(courseData);
        return array;
      }
    }
    return null;
  }

  async getStudnetById(id, txn = null) {
    const studentId = id;
    const { Student } = this.server.models();
    const student = await Student.query(txn).where('id', studentId).eager({
      contacts: true,
    });
    return student;
  }

  async getTransitionData(studentId, txn = null) {
    const { StageTransition } = this.server.models();
    const transitions = await StageTransition.query(txn).eager({
      feedback: true,
    }).where('studentId', studentId);
    return transitions;
  }

  async stageWiseGenderDistribution(txn = null) {
    const { Student } = this.server.models();
    const allStudents = await Student.query(txn).select('students.stage', 'students.gender')
      .orderBy('id', 'desc').limit(5000);

    const allReport = {};

    _.each(allStudents, (student) => {
      if (!allReport[student.stage]) {
        allReport[student.stage] = {
          1: 0, 2: 0, 3: 0, null: 0,
        };
      }
      allReport[student.stage][student.gender] += 1;
    });

    return allReport;
  }

  async stageWiseDanglingReport(txn = null) {
    const { Student } = this.server.models();

    const danglingReport = {};

    const danglingRecord = await Student.query(txn).eager({
      danglingtranstions: true,
    }).orderBy('id', 'desc').limit(5000);

    _.each(danglingRecord, (details) => {
      const [stageTransition] = details.danglingtranstions;
      if (stageTransition) {
        if (CONSTANTS.feedbackableStages.indexOf(details.stage) > -1) {
          const diffTime = Math.abs(new Date() - new Date(stageTransition.createdAt));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 3) {
            if (!danglingReport[details.stage]) {
              danglingReport[details.stage] = {
                1: 0, 2: 0, 3: 0, null: 0,
              };
            }

            danglingReport[details.stage][details.gender] += 1;
          }
        }
      }
    });

    return danglingReport;
  }
};
