const Schmervice = require("schmervice");
const _ = require("underscore");
const moment = require("moment");
const CONSTANTS = require("../constants");
const date = require("date-and-time");
module.exports = class StudentService extends Schmervice.Service {
  async deleteStudentDetails(student_id){
    const { 
      Student,
      Feedback, 
      StageTransition, 
      Contact, 
      studentCampus,
      StudentDonor,
      SlotBooked,
      DashboardFlag,
      EnrolmentKey,
      InterviewSlot,
      studentDocuments,
      studentJobDetails,

    } = this.server.models();
    await Feedback.query().delete().where({student_id})
    await StageTransition.query().delete().where({student_id})
    await Contact.query().delete().where({student_id})
    await studentCampus.query().delete().where({student_id})
    await StudentDonor.query().delete().where({student_id})
    await SlotBooked.query().delete().where({student_id})
    await DashboardFlag.query().delete().where({student_id})
    await EnrolmentKey.query().delete().where({student_id})
    await InterviewSlot.query().delete().where({student_id})
    await studentDocuments.query().delete().where({student_id})
    await studentJobDetails.query().delete().where({student_id})
    // await 
    await Student.query().delete().where('id',student_id)
    return true
  }
  async updateStudentDetails(student_id,details){
    const { Student } = this.server.models();
    console.log(details)
    const updateName = await Student.query()
      .patch(details).skipUndefined()
      .where("id", student_id);
    return updateName;
  }
  async markDuplicateOfSameStudent1(number, name) {
    const { Contact, Student } = this.server.models();
    const { assessmentService } = this.server.services();

    var contacts = await Contact.query()
      .select("id")
      .where("mobile", number)
      .withGraphFetched("student(filter)")
      .modifiers({
        filter: function (builder) {
          builder.select("id", "stage", "name");
        },
      });
    contacts = contacts
      .filter((contact) => {
        if (contact.student === null || contact.student.name === null) {
          return false;
        }
        if (
          contact.student.name.toLowerCase().split(" ").join("") ===
          name.toLowerCase().split(" ").join("")
        ) {
          return true;
        }
      })
      .map((contact) => {
        return contact.student.id;
      });
    contacts = contacts.sort().reverse();

    if (contacts.length === 0) {
      return {
        alreadyGivenTest: false,
      };
    } else {
      let pendingInterview = false;
      let pendingInterviewStage = null;
      const data = await Student.query()
        .select("id", "stage","gender")
        .whereIn("id", contacts)
        .withGraphFetched("enrolmentKey(filter)")
        .modifiers({
          filter: function (builder) {
            builder.select("key", "total_marks");
          },
        });
      const finalData = data.map((e) => {
        if (e.stage.includes("pending")) {
          pendingInterview = true;
          pendingInterviewStage = e.stage;
        }
        e.test_status = assessmentService.getEnrolmentKeyStatus(
          e.enrolmentKey.slice(-1)[0].key
        );
        e.total_marks = e.enrolmentKey.slice(-1)[0].total_marks;
        delete e.enrolmentKey;
        return e;
      });
      return {
        alreadyGivenTest: true,
        pendingInterview,
        pendingInterviewStage,
        data: finalData,
      };
    }
  }
  async addOrUpdateImgUlr(image_url, key) {
    const { Student, EnrolmentKey } = this.server.models();

    const student_id = await EnrolmentKey.query()
      .select("enrolment_keys.student_id")
      .where("key", key);
    const updatedurl = await Student.query()
      .patch({ image_url })
      .where("id", student_id[0].student_id);
    return updatedurl;
  }
  async updateEvaluationData(student_id, evaluation) {
    const { Student } = this.server.models();
    const updatedEvaluation = await Student.query()
      .patch({ evaluation })
      .where("id", student_id);
    return updatedEvaluation;
  }
  async updatePatnerId(id, partner_id) {
    const { Student } = this.server.models();
    const studentDetails = await Student.query().where("id", id);
    if (studentDetails.length > 0) {
      await Student.query()
        .update({ ...studentDetails[0], partner_id })
        .where("id", id);
      return { success: true };
    }
    return { success: false };
  }
  async leaveDaysCalculate(from, to) {
    let leave = date.subtract(to, from).toDays();
    return leave;
  }
  async deleteTransition(transitionId, schoolDiff, txn) {
    const { StageTransition, Student, Feedback, StudentStage } = this.server.models();
    console.log(transitionId, schoolDiff)
    if (schoolDiff === 1) {
      await StudentStage.query().where("id", transitionId).delete();
      return { success: true };
    }
      const transitions = await StageTransition.query(txn)
        .where("id", transitionId)
        .withGraphFetched({ feedbacks: true });
      if (transitions.length > 0) {
        const studentData = await Student.query().where(
          "id",
          transitions[0].student_id
        );
        const allTransition = await StageTransition.query(txn)
          .where("student_id", studentData[0].id)
          .orderBy("id");
        if (allTransition.length === 1) {
          await Student.query().where("id", transitions[0].student_id).update({
            stage: "",
          });
        } else if (allTransition.slice(-1)[0].id === transitionId) {
          await Student.query()
            .where("id", transitions[0].student_id)
            .update({
              stage: allTransition.slice(-2, -1)[0].to_stage,
            });
        } else if (allTransition[0].id === transitionId) {
          await StageTransition.query()
            .where("id", allTransition[1].id)
            .update({
              ...allTransition[1],
              from_stage: "",
            });
        } else {
          allTransition.map(async (transition, index) => {
            if (transitionId === transition.id) {
              await StageTransition.query()
                .where("id", allTransition[index + 1].id)
                .update({
                  ...allTransition[index + 1],
                  from_stage: allTransition[index - 1].to_stage,
                });
            }
          });
        }
      }
      if (transitions[0] !== undefined && transitions[0].feedbacks !== null) {
        await Feedback.query(txn)
          .where("id", transitions[0].feedbacks.id)
          .delete();
      }
      await StageTransition.query(txn).where("id", transitionId).delete();
      return { success: true }; 
  }
  async joiningDateChange(id, newDate, txn) {
    const { StageTransition } = this.server.models();
    const transitions = await StageTransition.query(txn).where("id", id);
    if (transitions.length > 0) {
      var returnValue = transitions[0];
      returnValue.created_at = newDate;
      await StageTransition.query(txn).where("id", id).update(returnValue);
    } else {
      var returnValue = null;
    }
    return returnValue;
  }
  async addOrUpdateName(student_id, name) {
    const { Student } = this.server.models();
    const updateName = await Student.query()
      .patch({ name })
      .where("id", student_id);
    return updateName;
  }
  async findJobKabLagega(joindateAndLeaveDays, student, totalMilestone = 18) {
    let leaveDays = joindateAndLeaveDays[1];
    let joindate = joindateAndLeaveDays[0];
    let milestone = student.stage;
    if (milestone === "onLeave") {
      milestone = student.lastTransition.from_stage;
    }
    let milestones = [
      "M1",
      "M2",
      "M3",
      "M4",
      "M5",
      "M6",
      "M7",
      "M8",
      "M9",
      "M10",
      "M11",
      "M12",
      "M13",
      "M14",
      "M15",
      "M16",
      "M17",
      "M18",
      "M19",
      "M20",
      "M21",
      "M22",
    ];
    if (!milestones.includes(milestone) || !joindate) {
      return null;
    }
    const actualMilestones = {
      M12: "M11",
      M13: "M12",
      M14: "M12",
      M15: "M13",
      M16: "M13",
      M17: "M14",
      M18: "M14",
      M19: "M15",
      M20: "M16",
      M21: "M17",
      M22: "M18",
    };
    if (Object.keys(actualMilestones).includes(milestone)) {
      milestone = actualMilestones[milestone];
    }
    let todayDate = new Date();
    let daysPassedInCampus =
      date.subtract(todayDate, joindate).toDays() - leaveDays;
    let kitneDinLagenge =
      (daysPassedInCampus / milestone.slice(1)) * totalMilestone;
    let kitneAurDin = kitneDinLagenge - (daysPassedInCampus + leaveDays);
    // console.log(kitneDinLagenge, daysPassedInCampus, kitneAurDin);
    let expectedDate = date.format(
      date.addDays(joindate, kitneDinLagenge),
      "YYYY-MM-DD"
    );
    return {
      daysPassedInCampus,
      kitneDinLagenge,
      kitneAurDin,
      expectedDate,
      leaveDays,
    };
  }
  async findById(id, txn = null) {
    const { Student } = this.server.models();
    const student = await Student.query(txn)
      .throwIfNotFound()
      .findById(id)
      .withGraphFetched("contacts");
    return student;
  }
  async filterByJoinedCampus(data){
    const { StageTransition } = this.server.models();
    const filteredData = []
    for (var i of data){
      // console.log(i)
      const studentJoinedCampus = await StageTransition.query()
      .where("to_stage", "finallyJoined")
      .andWhere("student_id",i.id)
      if (studentJoinedCampus.length!==0){
        filteredData.push(i)
      }
    }
    return filteredData
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
      .withGraphFetched(eagerRelation)
      .where("partner_id", partner_id)
      .andWhere("created_at", ">=", FromDate)
      .andWhere("created_at", "<=", ToDate);

    return students;

    // if (FromDate && !ToDate) {
    //   const students = await Student.query(txn)
    //     .withGraphFetched(eagerRelation)
    //     .where("partner_id", partner_id)
    //     .andWhere("created_at", ">=", FromDate);
    //   return students;
    // }
    // if (!FromDate && ToDate) {
    //   const students = await Student.query(txn)
    //     .withGraphFetched(eagerRelation)
    //     .where("partner_id", partner_id)
    //     .andWhere("created_at", "<=", ToDate);
    //   return students;
    // }
    // if (FromDate && ToDate) {
    //   const students = await Student.query(txn)
    //     .withGraphFetched(eagerRelation)
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
    const q = EnrolmentKey.query().withGraphFetched({
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
    const q = IncomingCall.query().withGraphFetched({
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
    const result = await Student.query(txn).withGraphFetched(eagerExp);
    return result;
  }

  async findAllByContact(mobile, txn = null) {
    const { Contact } = this.server.models();
    const contact = await Contact.query(txn).where({ mobile }).withGraphFetched("student");
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
      .withGraphFetched("student");
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

  async deleteTransitionsByStudentId(student_id, txn = null) {
    const { Student, StageTransition, Feedback } = this.server.models();
    // await StageTransition.query(txn).delete().where({ student_id });
    // await Feedback.query(txn).delete().where({ student_id });
    const stage = "enrolmentKeyGenerated";
    await Student.query(txn).where("id", student_id).update({ stage: stage });
    await StageTransition.query(txn).insert({ student_id, to_stage: stage });
    const studentDetails = await Student.query(txn).where("id", student_id);
    if (studentDetails.length === 0) {
      throw new Error("student id is not present. enter a correct student id");
    }
    return studentDetails[0];
  }
  async createWithoutExam(Details = {}, txn = null) {
    const { Student } = this.server.models();
    const details = Details;
    const { whatsapp,alt_mobile,stage,campus,donor } = details;
    delete details.whatsapp;
    delete details.alt_mobile;
    delete details.campus;
    delete details.donor;
    details.studentCampus = [{campus_id:campus}]
    details.contacts = [
      { mobile:whatsapp, is_whatsapp: true, contact_type: "primary",alt_mobile },
    ];
    
    // add a transition
    if (stage=='inJob'){

      details.transitions = [{ to_stage: 'createdStudentWithoutExam' },{to_stage:'finallyJoined'},{ to_stage: stage }];
    }else{
      details.transitions = [{ to_stage: 'createdStudentWithoutExam' },{ to_stage: stage }];

    }
    const studentDetails = await Student.query(txn).insertGraph(details);
    return studentDetails;
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
      if (options.student_id) {
        student = await this.deleteTransitionsByStudentId(options.student_id);
        // student={id:options.student_id}
      } else {
        student = await this.create(
          "enrolmentKeyGenerated",
          options.fromHelpline ? "getEnrolmentKey" : null,
          { mobile: options.mobile, partner_id: partner_id }
        );
      }
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
      .withGraphFetched({
        student: {
          transitions: true,
          enrolmentKey: true,
        },
      });
    const studentDetails = [];
    _.each(contact, (studentInfo) => {
      const { student } = studentInfo;
      const { transitions, enrolmentKey } = student;
      const [EnrolmentKey] = enrolmentKey.slice(-1);
      const studentStatus = {};
      const updatedStage = transitions[transitions.length - 1];
      if (updatedStage.to_stage !== "requestCallback") {
        studentStatus.name = student.name;
        studentStatus.city = student.city;
        studentStatus.district = student.district;
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
  async commonFunc(courseData, searchDonorName, limit) {
    const array = await this.softwareCourse(courseData.results);
    courseData.results = await this.addStudentDetails(array);
    if (searchDonorName != "") {
      courseData.results = courseData.results.filter((data) => {
        if (data.studentDonor != null) {
          return data.studentDonor
            .map((data) => {
              return data.donor.includes(searchDonorName);
            })
            .includes(true);
        } else {
          return false;
        }
      });
    }
    // if (courseData.results.length < limit) {
      // courseData.total = courseData.results.length;
    // }
    if (limit != undefined) {
      courseData.totalNoOfPages = Math.round(courseData.total / limit);
    } else {
      courseData.totalNoOfPages = 0;
    }
    return courseData;
  }
  async studentsData(fromDate, toDate, txn = null) {
    const FromDate = fromDate;
    const ToDate = toDate;
    const { Student } = this.server.models();
    if (FromDate && ToDate) {
      var courseData = await Student.query(txn)
        .where("created_at", ">=", FromDate)
        .andWhere("created_at", "<=", ToDate);
      return courseData;
    }
    if (FromDate && !ToDate) {
      var courseData = await Student.query(txn).where(
        "created_at",
        ">=",
        FromDate
      );
      return courseData;
    }
    if (!FromDate && !ToDate) {
      var courseData = await Student.query(txn);
      return courseData;
    }
  }
  async studentsDataForDashBoard(
    studentStatus,
    school,
    typeOfData,
    fromDate,
    toDate,
    stage,
    limit,
    page = 0,
    searchName = "",
    SearchNumber = "",
    searchPartnerName = "",
    searchDonorName = "",
    searchCampusName = "",
    searchOwnerName = "",
    searchByStatus = "",
    gender = [1, 2, 3],
    testMode,
    txn = null
  ) {
    const FromDate = fromDate;
    const ToDate = toDate;
    const Stage = stage != null ? stage.split(",") : stage;
    const studentTypeOfData = typeOfData;
    const { Student, Contact, Partner, Feedback, Campus, studentCampus ,EnrolmentKey } =
      this.server.models();
    const { feedbackService } = this.server.services();
    const eagerRelation = {
      partner: true,
      school: true,
      contacts: true,
      enrolmentKey: true,
      partnerAssessment: true,
      lastTransition: true,
      feedbacks: true,
      feedback: true,
      campus: true,
      studentDonor: true,
      student_school_stage:true,
    };
    var query = `Student.query(txn)
    .orderByRaw('last_updated DESC NULLS LAST')
    .whereIn("gender", gender)
    .page(page, limit)
    .withGraphFetched(eagerRelation)
    `;
    if (typeof gender !== "object") {
      gender = [gender];
    }
    if (!Stage && !studentTypeOfData) {
      query += `
    .whereNot("stage", "requestCallback")
    .whereNot("stage", "enrolmentKeyGenerated")
    .whereNot("stage", "basicDetailsEntered")
    `;
    }
    if (Stage) {
      query += `.whereIn("stage", Stage)`;
    }

    if (FromDate) {
      query += `.andWhere("created_at", ">=", FromDate)`;
    }
    if (ToDate) {
      query += `.andWhere("created_at", "<=", ToDate)`;
    }
    if (studentTypeOfData === "requestCallback") {
      query += `.where("stage", studentTypeOfData)`;
    }
    if (searchName != "") {
      query += `.whereRaw("LOWER(name) LIKE ?", ['${`%${searchName.toLowerCase()}%`}'])`;
    }
    if (SearchNumber != "") {
      var numberSearch = await Contact.query()
        .select("student_id as id")
        .where("mobile", "like", `%${SearchNumber}%`);
      for (let n in numberSearch) {
        numberSearch[n] = numberSearch[n].id;
      }

      query += `.whereIn("id", numberSearch)`;
    }
    if (searchCampusName != "") {
      var searchCampus = await Campus.query()
        .select("id")
        .whereRaw(`LOWER(campus) LIKE ?`, [
          `%${searchCampusName.toLowerCase()}%`,
        ]);
      for (let n in searchCampus) {
        searchCampus[n] = searchCampus[n].id;
      }
      var searchCampusStudent = await studentCampus
        .query()
        .select("student_id as id")
        .whereIn(`campus_id`, searchCampus);
      for (let n in searchCampusStudent) {
        searchCampusStudent[n] = searchCampusStudent[n].id;
      }
      query += `.whereIn("id", searchCampusStudent)`;
    }
    if (searchOwnerName != "") {
      var searchOwner = await Feedback.query()
        .select("student_id as id", "student_stage as stage")
        .whereRaw(`LOWER(to_assign) LIKE ?`, [
          `%${searchOwnerName.toLowerCase()}%`,
        ]);
      var ownerFilter = [];
      for (var n in searchOwner) {
        var owner = await Student.query()
          .select("stage")
          .where("id", searchOwner[n].id);
        if (owner[0] && owner[0]["stage"].includes(searchOwner[n]["stage"])) {
          ownerFilter.push(searchOwner[n].id);
        }
      }
      query += `.whereIn("id", ownerFilter)`;
    }

    // Filter by stage status
    if (searchByStatus.length > 0) {
      var searchStatus = await Feedback.query()
        .select("student_id as id", "student_stage as stage")
        .where("state", searchByStatus);
      var statusFilter = [];
      for (var n in searchStatus) {
        var status = await Student.query()
          .select("stage")
          .where("id", searchStatus[n].id);
        if (
          status[0] &&
          status[0]["stage"].includes(searchStatus[n]["stage"])
        ) {
          statusFilter.push(searchStatus[n].id);
        }
      }
      query += `.whereIn("id", statusFilter)`;
    }

    if (searchPartnerName != "") {
      var searchPartner = await Partner.query()
        .select("id")
        .whereRaw(`LOWER(name) LIKE ?`, [
          `%${searchPartnerName.toLowerCase()}%`,
        ]);
      for (let n in searchPartner) {
        searchPartner[n] = searchPartner[n].id;
      }
      query += `.whereIn("partner_id", searchPartner)`;
    }
    query+=`.modifyGraph("enrolmentKey", (builder) => {
      builder.orderBy('created_at','DESC');
    })`


    let schoolData;
    if (school !== undefined) {
      const courseData = await eval(query);
      schoolData = courseData.results.filter(v => v.school[0].id == school)
    }

    if (school !== undefined) {
      return this.commonFunc(schoolData, searchDonorName, limit);
    }
    let statusData;
    if(studentStatus === "testPass"){
      const courseData = await eval(query);
      statusData = courseData.results.filter(v => v.stage !== 'enrolmentKeyGenerated' && v.stage !=='testFailed' && v.stage !== 'basicDetailsEntered')
    }
    if (studentStatus !== undefined) {
      return this.commonFunc(statusData, searchDonorName, limit);
    }
    // console.log(query, "query");
    const courseData = await eval(query);
    return this.commonFunc(courseData, searchDonorName, limit);
  }
  async addStudentDetails(array) {
    const { Donor } = this.server.models();
    const { feedbackService } = this.server.services();
    const promises = _.map(array, async (student) => {
      student.studentDonor = student.studentDonor
        ? student.studentDonor.donor_id
        : student.studentDonor;
      const date = await feedbackService.joinedCampusDate(student.id);
      student.joinedDate = date[0];
      student.jobKabLagega = await this.findJobKabLagega(date, student);
      student.campus =
        student.campus && student.campus.length > 0
          ? student.campus[0].campus
          : null;
      for (const i in student.studentDonor) {
        const DonorName = await Donor.query().where({
          id: student.studentDonor[i],
        });
        student.studentDonor[i] = await DonorName[0];
      }
    });
    await Promise.all(promises);
    return array;
  }
  async getStudentById(id, txn = null) {
    const studentId = id;
    const { Student } = this.server.models();

    const student = await Student.query(txn).where("id", studentId).withGraphFetched({
      partner: true,
      contacts: true,
      enrolmentKey: true,
      partnerAssessment: true,
      lastTransition: true,
      feedbacks: true,
      campus: true,
      studentDonor: true,
      feedback: true,
      school: true,
      student_school_stage: true,
    });
    const studentArray = await this.addStudentDetails(student);
    return studentArray;
  }

  async getTransitionData(student_id, txn = null) {
    const { StageTransition } = this.server.models();
    const transitions = await StageTransition.query(txn)
      .withGraphFetched({
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
      .withGraphFetched({
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
      .withGraphFetched({
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
      .withGraphFetched({
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

  async addOrUpdateEmail(email, student_id) {
    const { Student } = this.server.models();
    const updateEmail = await Student.query()
      .patch({ email })
      .where("id", student_id);
    return updateEmail;
  }
  async updateRedFlag(student_id, redflag) {
    if (redflag == " " || redflag == "") {
      redflag = null;
    }
    const { Student } = this.server.models();
    const updatedFlag = await Student.query()
      .patch({ redflag: redflag })
      .where("id", student_id);
    return updatedFlag;
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
  async markDuplicateOfSameStudent(
    number,
    name,
    enrolmentKey,
    assessmentService
  ) {
    const { Contact, Student } = this.server.models();

    var contacts = await Contact.query()
      .select("id")
      .where("mobile", number)
      .withGraphFetched("student(filter)", {
        filter: function (builder) {
          builder.select("id", "stage", "name");
        },
      });
    var flag = true;
    var indexMain = undefined;
    contacts = contacts
      .filter((contact) => {
        if (contact.student === null) {
          return false;
        }
        if (
          contact.student.name === name ||
          contact.student.name === null ||
          enrolmentKey.student_id === contact.student.id
        ) {
          return true;
        }
      })
      .map((contact, index) => {
        if (enrolmentKey.student_id === contact.student.id) {
          indexMain = index;
        }
        return contact;
      })
      .map((contact, index) => {
        if (contact.student.stage.includes("pending")) {
          indexMain = index;
          flag = false;
        }
        return contact;
      })
      .map(async (contact, index) => {
        if (
          indexMain !== undefined &&
          index !== indexMain &&
          contact.student.stage !== "possibleDuplicate"
        ) {
          await assessmentService.recordStageTranisiton(
            contact.student,
            "possibleDuplicate",
            null,
            "-*auto update*-"
          );
          await Student.query()
            .where("id", contact.student.id)
            .update({ stage: "possibleDuplicate" });
        }
      });
    return { success: flag };
  }
  async UpdateJobDescription(data,id){
    const {  studentJobDetails } = this.server.models();
    await studentJobDetails.query().update({...data}).where('id',id)
    return await studentJobDetails.query().where('id',id)
  }
  async insertJobDescription(data){
    const {  studentJobDetails } = this.server.models();
    return await studentJobDetails.query().insert({...data}) 
  }

  async filterByJobstudents(data){
    const { StageTransition } = this.server.models();
    const filteredData = []
    for (var i of data){
      const studentJoinedCampus = await StageTransition.query()
      .where("to_stage", "inJob")
      .andWhere("student_id",i.student_id)
      if (studentJoinedCampus.length!==0){
        filteredData.push(i)
      }
    }
    return filteredData
  }
  async getJobDescription(){
    const { Student } = this.server.models();
    const data = await Student.query()
    .select(
      "id as student_id",
      "name",
      "gender",
      "email",
      "qualification"
      )
      .whereIn("stage", ["inJob","payingForward","paidForward"]) 
      .withGraphFetched({
        'student_job_details':true,
        'student_job_details_all':true,
        'contacts':true,
        'partner':true,
        'campus':true,
        'studentDonor':true,
      });
    
    const result =  []
    for (var e of data){

      const { StageTransition } = this.server.models();
      const transitions = await StageTransition.query()
      .where("student_id", e.student_id)
      .andWhere("to_stage", "like", "finally%");
      if (transitions.length > 0) {
        e.joinDate = transitions[0].created_at;
      } else {
        e.joinDate = null;
      }
      result.push(e)
    }
      
    return result
  }

  async studentsDataByDate(fromDate, toDate,campus_id) {  
    const { StageTransition, Student, studentCampus } = this.server.models();
    try{
    const getStudentId = await studentCampus.query().where('campus_id', campus_id);
    let storeStudentId = getStudentId.map(student_id => student_id.student_id);
    var offerletterData = await StageTransition.query()
        .whereIn('student_id', storeStudentId)
        .where("created_at", ">=", fromDate)
        .andWhere("created_at", "<=", toDate);

    let filteredStudent= offerletterData.filter(el=>(el.to_stage==='offerLetterSent'))
    let studentId=filteredStudent.map(student_id=>student_id.student_id)
    const getStudentDetails = await Student.query().whereIn('id',studentId)
    return getStudentDetails
    }
    catch(error){
      logger.error(JSON.stringify(error));
      return [errorHandler(error), null];
    }
  }

  
};
