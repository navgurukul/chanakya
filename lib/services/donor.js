const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash")
module.exports = class DonorService extends Schmervice.Service {
  async updateOrInsertById(studentId, donor) {
    const { Donor } = this.server.models();
    const Count = await Donor.query().where("student_id", studentId).count();
    let donorUpdate;
    if (Count[0].count > 0) {
        donorUpdate = await Donor.query().where("student_id", studentId).patch({ student_id:studentId, donor });
    } else {
        donorUpdate = await Donor.query().insertGraph({  student_id:studentId, donor });
    }
    return donorUpdate;
  }
  
  async progressMade(donor) {
    const { Donor } = this.server.models();
    const { Student } = this.server.models();


    const convertedData = {
      'Selected for Navgurukul One-year Fellowship': {
        selectedAndJoiningAwaited: [],
        offerLetterSent: [],
        pendingTravelPlanning: [],
        finalisedTravelPlans: [],
        finallyJoined: [],
        finallyJoinedDharamshala: [],
        finallyJoinedPune: [],
        finallyJoinedBangalore: [],
        finallyJoinedSarjapura: [],
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
      },
    };

    const student_id = await Donor.query().select('student_id')
      .where('donor','like', '%'+donor+'%')
       const promisesNeedtoR =  _.map(student_id,async(each_student)=>{
        let student =await Student.query().where("id",each_student['student_id']).eager({ contacts: true })
        student = student[0]
        const { stage } = student;
        const data = {};
        data.name = student.name;
        data.mobile = student.contacts.length > 0 ? student.contacts[0].mobile : null;
        data.stage = student.stage;
        data.status = student.feedbacks ? student.feedbacks.state : null;
        if (
          // stage === 'finallyJoined',
          stage.startsWith('finallyJoined')
          || stage === 'finalisedTravelPlans'
          || stage === 'pendingTravelPlanning'
          || stage === 'deferredJoining'
          || stage === 'selectedAndJoiningAwaited'
          || stage === 'offerLetterSent'
        ) {
            convertedData['Selected for Navgurukul One-year Fellowship'][
              stage
            ].push(data);

        }
        if (
          stage == 'pendingAlgebraInterview'
          || stage == 'pendingCultureFitInterview'
          || stage == 'pendingEnglishInterview'
          || stage == 'pendingParentConversation'
        ) {
          convertedData['Need Action'][stage].push(data);
        }
        if (stage == 'becameDisIntersested' || stage == 'notReachable') {
          convertedData['Need Your Help'][stage].push(data);
        }
        if (
          stage == 'testFailed'
          || stage == 'englishInterviewFail'
          || stage == 'algebraInterviewFail'
        ) {
          convertedData['Failed Students'][stage].push(data);
        }
        return convertedData
      })
      await Promise.all(promisesNeedtoR)
    return convertedData;
  }

};
