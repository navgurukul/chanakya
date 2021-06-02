/* eslint-disable no-return-await */
/* eslint-disable guard-for-in */
/* eslint-disable no-shadow */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
const Schmervice = require('schmervice');
const Joi = require('joi');
const _ = require('lodash');

module.exports = class DonorService extends Schmervice.Service {
  async updateOrInsertById(studentId, donor) {
    const { Donor } = this.server.models();
    const Count = await Donor.query().where('student_id', studentId).count();
    let donorUpdate;
    if (Count[0].count > 0) {
      donorUpdate = await Donor.query().where('student_id', studentId).patch({ student_id: studentId, donor });
    } else {
      donorUpdate = await Donor.query().insertGraph({ student_id: studentId, donor });
    }
    return donorUpdate;
  }

  async progressMade(donors_id) {
    const { StudentDonor } = this.server.models();
    const { Student, Donor } = this.server.models();
    const data = await StudentDonor.query();
    const convertedData = [];
    for (const i in data) {
      if (data[i].donor_id.includes(donors_id)) {
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
