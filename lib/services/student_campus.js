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

      student[0].studentDonor = (await Boolean(student[0].studentDonor))
        ? student[0].studentDonor.donor_id
        : student[0].studentDonor;
      student[0].campus =
        student[0].campus.length > 0 ? student[0].campus[0].campus : null;

      const date = await feedbackService.joinedCampusDate(student[0].id);
      student[0].joinedDate = date[0];
      student[0].jobKabLagega = await studentService.findJobKabLagega(
        date,
        student[0]
      );
      // console.log(date, student);
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
