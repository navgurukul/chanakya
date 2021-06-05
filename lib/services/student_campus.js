/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable guard-for-in */
/* eslint-disable no-shadow */
/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-destructuring */
const Schmervice = require('schmervice');
// eslint-disable-next-line import/no-extraneous-dependencies
const _ = require('lodash');

module.exports = class studentCampusService extends Schmervice.Service {
  async progressMade(campus_id) {
    const { studentCampus } = this.server.models();
    const { Student, Donor } = this.server.models();
    const data = await studentCampus.query().where('campus_id', campus_id);
    const convertedData = [];
    for (const i in data) {
      const student = await Student.query().where('id', data[i].student_id).eager({
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
      student[0].campus = student[0].campus.length > 0
        ? student[0].campus[0].campus
        : null;

      for (const i in student[0].studentDonor) {
        // eslint-disable-next-line no-await-in-loop
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
