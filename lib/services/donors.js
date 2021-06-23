/* eslint-disable no-return-await */
/* eslint-disable guard-for-in */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const Schmervice = require("schmervice");
const Joi = require("joi");
const _ = require("lodash");

module.exports = class DonorService extends Schmervice.Service {
  async progressMade(donors_id) {
    const { StudentDonor } = this.server.models();
    const { Student, Donor } = this.server.models();
    const { feedbackService, studentService } = this.server.services();
    const data = await StudentDonor.query();
    const convertedData = [];
    for (var i in data) {
      if (data[i].donor_id.includes(donors_id)) {
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
        student[0].jobKabLagega = await studentService.findJobKabLagega(
          date,
          student[0].stage
        );
        for (const i in student[0].studentDonor) {
          const DonorName = await Donor.query().where({
            id: student[0].studentDonor[i],
          });
          student[0].studentDonor[i] = DonorName[0];
        }
        convertedData.push(student[0]);
      }
    }
    return convertedData;
  }
  async findall() {
    const { Donor } = this.server.models();
    return await Donor.query();
  }
};
