const Schmervice = require("schmervice");
const _ = require("lodash");
const Boom = require("boom");

module.exports = class studentCampusService extends Schmervice.Service {
  async progressMade(campus_id) {
    const { studentCampus } = this.server.models();
    const { Student, Donor } = this.server.models();
    const { feedbackService, studentService } = this.server.services();
    const data = await studentCampus.query().where("campus_id", campus_id);
    const convertedData = [];
    for (const i in data) {
      const student = await Student.query()
        .where("id", data[i].student_id)
        .eager({
          partner: true,
          contacts: true,
          enrolmentKey: true,
          partnerAssessment: true,
          lastTransition: true,
          feedbacks: true,
          campus: true,
          studentDonor: true,
        });

      let students = await studentService.addStudentDetails(student);
      convertedData.push(students[0]);
    }
    return convertedData;
  }
};