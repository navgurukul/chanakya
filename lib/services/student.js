
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
      transitions: true,
      enrolmentKey: true,
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
      studentStatus.Name = student.name;
      studentStatus.City = student.city;
      studentStatus.State = CONSTANTS.studentDetails.states[student.state];
      studentStatus.Gender = _.invert(CONSTANTS.studentDetails.gender)[student.gender];
      studentStatus.Transitions = transitions;
      studentStatus.CurrentStage = updatedStage.toStage;
      studentStatus.LastUpdate = updatedStage.fromStage;
      if (updatedStage.toStage !== 'enrolmentKeyGenerated') { // send english test link to student.
        studentStatus.Marks = EnrolmentKey.totalMarks;
        if (updatedStage.toStage === 'pendingEnglishInterview') {
          studentStatus.linkForEnglishTest = null; //`http://join.navgurukul.org/englishTest/${EnrolmentKey.key}`;
        } else {
          studentStatus.linkForEnglishTest = null;
        }
      } else { // If student not given online test.
        studentStatus.Marks = null;
        studentStatus.linkForEnglishTest = null;
        if (EnrolmentKey) {
          studentStatus.linkForOnlineTest = `http://join.navgurukul.org/k/${EnrolmentKey.key}`;
        } else {
          studentStatus.linkForOnlineTest = null;
        }
      }
      studentDetails.push(studentStatus);
    });
    return studentDetails;
  }
};
