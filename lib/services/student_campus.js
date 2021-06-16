const Schmervice = require("schmervice");
const _ = require("lodash");
const Boom = require("boom");

module.exports = class studentCampusService extends Schmervice.Service {
  async UpdatejoinedCampusOn(studentId, date) {
    const { studentCampus } = this.server.models();
    console.log(studentId, date);
    const oneStudentData = await studentCampus
      .query()
      .where("student_id", studentId);
    // console.log(oneStudentData);
    if (oneStudentData.length === 0) {
      throw Boom.badRequest("Student not in campus");
    }
    await studentCampus
      .query()
      .where("student_id", studentId)
      .update({ ...oneStudentData[0], joined_campus_on: date });
    return { success: true };
  }
  async progressMade(campus_id) {
    const { studentCampus } = this.server.models();
    const { Student, Donor } = this.server.models();
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

      student[0].studentDonor = (await Boolean(student[0].studentDonor))
        ? student[0].studentDonor.donor_id
        : student[0].studentDonor;
      student[0].campus =
        student[0].campus.length > 0 ? student[0].campus[0].campus : null;

      for (const i in student[0].studentDonor) {
        const DonorName = await Donor.query().where({
          id: student[0].studentDonor[i],
        });
        student[0].studentDonor[i] = DonorName[0];
      }
      convertedData.push(student[0]);
    }
    return convertedData;
  }
};
