const Schmervice = require("schmervice");
const _ = require("lodash");
const Boom = require("boom");

module.exports = class studentCampusService extends Schmervice.Service {
  async removeCampusById(student_id) {
    const { studentCampus } = this.server.models();
    await studentCampus.query().delete().where("student_id", student_id);
    return { success: true };
  }
  async studentProgress(data) {
    const { Student, Donor } = this.server.models();
    const { feedbackService, studentService } = this.server.services();
    const convertedData = [];
    for (const i in data) {
      const student = await Student.query()
        .where("id", data[i].student_id)
        .withGraphFetched({
          partner: true,
          contacts: true,
          enrolmentKey: true,
          partnerAssessment: true,
          lastTransition: true,
          feedbacks: true,
          campus: true,
          studentDonor: true,
          studentDocuments:true,
        });
      let students = await studentService.addStudentDetails(student);
      convertedData.push(students[0]);
    }
    return convertedData;
  }
  async filterByJoinedCampus(data){
    const { StageTransition } = this.server.models();
    const filteredData = []
    for (var i of data){
      const studentJoinedCampus = await StageTransition.query()
      .where("to_stage", "finallyJoined")
      .andWhere("student_id",i.student_id)
      if (studentJoinedCampus.length!==0){
        filteredData.push(i)
      }
    }
    return filteredData
  }
  async allCampusProgressMade() {
    const { studentCampus } = this.server.models();
    //get all students who are in campus table
    const data = await studentCampus.query();
    const result = await this.studentProgress(
    //filter students who has not yet joined campus
    //filter by finallyJoined stage
    await this.filterByJoinedCampus(data)
    );
    return result;
  }
  async progressMade(campus_id) {
    const { studentCampus } = this.server.models();
    //get all students ids whos campus id matches
    const data = await studentCampus.query().where("campus_id", campus_id);
   

    const result = await this.studentProgress(
    //filter students who has not yet joined campus
    //filter by finallyJoined stage
      await this.filterByJoinedCampus(data)
    );
    return result;
  }
};
